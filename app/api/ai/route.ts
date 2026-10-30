import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
const MAX_TEXT = 60_000;
const MAX_IMAGE_B64 = 6_000_000;

// Basic per-IP limiter (in-memory, per server instance). Replace with accounts/plans in Phase 2.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), windowMs = 60 * 60 * 1000, max = Number(process.env.AI_HOURLY_LIMIT || 30);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now); hits.set(ip, recent);
  return recent.length > max;
}

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function ask(system: string, content: unknown, maxTokens = 2000): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error(`AI service error (${res.status})`);
  const data = await res.json();
  return (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
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
  return NextResponse.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return err("AI features are not configured on this server yet.", 503);
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
        return NextResponse.json({ result: await ask(`You write image captions. ${style} Output only the caption text.`, [{ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } }, { type: "text", text: "Caption this image." }]) });
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
