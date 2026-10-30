import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Provider: Anthropic when ANTHROPIC_API_KEY is set, otherwise a free public service that needs no key.
const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);
const API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
const PUBLIC_TEXT_URL = process.env.AI_PUBLIC_URL || "https://text.pollinations.ai/openai";
const PUBLIC_IMAGE_URL = process.env.AI_IMAGE_URL || "https://image.pollinations.ai/prompt";
const MAX_TEXT = 60_000;
const MAX_IMAGE_B64 = 6_000_000;
const TIMEOUT_MS = 45_000;

// Basic per-IP limiter (in-memory, per server instance). Replace with accounts/plans in Phase 2.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), windowMs = 60 * 60 * 1000, max = Number(process.env.AI_HOURLY_LIMIT || 30);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now); hits.set(ip, recent);
  return recent.length > max;
}

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 429) throw new Error("The free AI service is busy right now. Please try again in a minute.");
  if (!res.ok) throw new Error(`AI service error (${res.status}). Please try again.`);
  return res.json();
}

/** Sends a prompt (plus an optional image as a data URL) to whichever provider is available. */
async function ask(system: string, text: string, maxTokens = 2000, imageDataUrl?: string): Promise<string> {
  if (HAS_KEY) {
    const m = imageDataUrl?.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    const content = m ? [{ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } }, { type: "text", text }] : text;
    const data = await fetchJson(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
    });
    return (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
  }
  const user = imageDataUrl ? [{ type: "text", text }, { type: "image_url", image_url: { url: imageDataUrl } }] : text;
  const data = await fetchJson(PUBLIC_TEXT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "openai", max_tokens: maxTokens, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== "string" || !out.trim()) throw new Error("The AI service returned an empty answer. Please try again.");
  return out.trim();
}

/** Public image generation (no key): fetched server-side so the browser gets a same-origin data URL. */
async function generateImage(prompt: string): Promise<string> {
  const url = `${PUBLIC_IMAGE_URL}/${encodeURIComponent(prompt + ", clean wide background scene, no people, no text")}?width=1280&height=960&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 429) throw new Error("The free AI service is busy right now. Please try again in a minute.");
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) throw new Error("Could not generate a background right now. Please try again.");
  return `data:${type.split(";")[0]};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

/** Keeps only drawing elements from model-generated SVG. */
function cleanSvg(raw: string) {
  const m = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) throw new Error("The AI did not return a valid scene. Try again.");
  return m[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "");
}

export async function GET() {
  return NextResponse.json({ configured: true, provider: HAS_KEY ? "anthropic" : "public" });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return err("Hourly AI limit reached. Please try again later.", 429);

  let body: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  try { body = await req.json(); } catch { return err("Invalid request.", 400); }
  const text = typeof body.text === "string" ? body.text : "";
  if (text.length > MAX_TEXT) return err("Text is too long (limit 60,000 characters).", 413);

  try {
    switch (body.action) {
      case "summarize": {
        if (text.trim().length < 20) return err("Please provide more text to summarise.", 400);
        const len = { short: "2-3 sentences", medium: "one short paragraph", detailed: "a detailed summary covering all key points" }[body.length as string] ?? "one short paragraph";
        const style = body.format === "bullets" ? "Use concise bullet points." : "Write in plain prose.";
        return NextResponse.json({ result: await ask(`You summarise documents faithfully without adding facts. Write ${len}. ${style} Reply in the same language as the text. Output only the summary.`, text) });
      }
      case "grammar": {
        if (!text.trim()) return err("Please enter some text.", 400);
        const tone = ["formal", "friendly", "concise"].includes(body.tone) ? `Also adjust the tone to be ${body.tone}.` : "Keep the original tone and meaning.";
        return NextResponse.json({ result: await ask(`You are a careful copy editor. Fix grammar, spelling and punctuation. ${tone} Keep the original language. Output only the corrected text, with no commentary.`, text) });
      }
      case "caption": {
        const m = typeof body.image === "string" ? body.image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/) : null;
        if (!m) return err("Please upload a JPG, PNG, WebP or GIF image.", 400);
        if (m[2].length > MAX_IMAGE_B64) return err("Image is too large. Try a smaller one.", 413);
        const style = { alt: "Write concise, objective alt text (under 125 characters) for accessibility.", social: "Write 3 engaging social media captions with a few relevant hashtags each.", descriptive: "Write a detailed one-paragraph description." }[body.style as string] ?? "Write one clear caption.";
        return NextResponse.json({ result: await ask(`You write image captions. ${style} Output only the caption text.`, "Caption this image.", 1000, body.image) });
      }
      case "resume": {
        if (!body.resume || typeof body.resume !== "object") return err("Missing resume data.", 400);
        const out = await ask("You improve resumes. Rewrite the summary and each experience bullet to be concise, achievement-focused and in strong action-verb style. Never invent employers, dates, degrees or numbers. Return ONLY valid JSON with exactly the same shape and keys as the input.", JSON.stringify(body.resume), 3000);
        const json = out.match(/\{[\s\S]*\}/);
        if (!json) return err("The AI response could not be read. Try again.", 502);
        return NextResponse.json({ result: JSON.parse(json[0]) });
      }
      case "background": {
        const prompt = String(body.prompt || "").slice(0, 300);
        if (prompt.trim().length < 3) return err("Describe the background you want.", 400);
        if (!HAS_KEY) return NextResponse.json({ result: await generateImage(prompt) });
        const raw = await ask("You are an illustrator that outputs a single self-contained SVG scene for use as a photo backdrop. Use viewBox=\"0 0 1600 1200\", rich gradients, soft shapes and depth; keep it tasteful and uncluttered in the centre. No text, no scripts, no external references. Output only the <svg> element.", prompt, 6000);
        return NextResponse.json({ result: cleanSvg(raw) });
      }
      default:
        return err("Unknown action.", 400);
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : "AI request failed.", 502);
  }
}
