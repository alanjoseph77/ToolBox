import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { delKey, getKey, setKey, storeUsable } from "@/lib/shareStore";

export const runtime = "nodejs";

const TTL: Record<string, number> = { "1h": 3600, "1d": 86400, "7d": 604800 };
const MAX_CHARS = 200_000;                                        // plain text up to ~100k characters, or the same text once encrypted
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";               // no look-alike letters (i, l, o, 0, 1)
const ID_RE = /^[a-hj-km-np-z2-9]{6}$/;

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const hits = new Map<string, number[]>();                          // light per-IP limit on creating pads (per server instance)
const limited = (ip: string) => { const now = Date.now(), r = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000); r.push(now); hits.set(ip, r); return r.length > 40; };
const ip = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

interface Rec { text: string; enc?: { s: string; i: string }; token: string; created: number; updated: number; exp: number }
const cleanEnc = (e: unknown) => (e && typeof e === "object" && typeof (e as { s?: unknown }).s === "string" && typeof (e as { i?: unknown }).i === "string" && (e as { s: string }).s.length < 64 && (e as { i: string }).i.length < 64 ? { s: (e as { s: string }).s, i: (e as { i: string }).i } : undefined);

const off = () => err("Code Share is not switched on yet on this site. The site owner needs to connect a storage (Vercel KV or Upstash).", 503);

export async function POST(req: NextRequest) {
  if (!storeUsable) return off();
  if (limited(ip(req))) return err("Too many pads created. Please try again in an hour.", 429);
  const b = await req.json().catch(() => null);
  if (!b || typeof b.text !== "string" || !b.text.trim()) return err("Write something first.", 400);
  if (b.text.length > MAX_CHARS) return err("That is too long. The limit is about 100,000 characters.", 413);
  const ttl = TTL[b.ttl as string] ?? TTL["1d"], enc = cleanEnc(b.enc), token = randomBytes(12).toString("hex"), now = Date.now();
  for (let i = 0; i < 8; i++) {
    const id = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const rec: Rec = { text: b.text, enc, token, created: now, updated: now, exp: now + ttl * 1000 };
    if (await setKey(`cs:${id}`, JSON.stringify(rec), ttl, true)) return NextResponse.json({ id, token, expires: rec.exp });
  }
  return err("Could not create a pad. Please try again.", 500);
}

export async function GET(req: NextRequest) {
  if (!storeUsable) return off();
  const id = req.nextUrl.searchParams.get("id")?.toLowerCase().trim() ?? "";
  if (!ID_RE.test(id)) return err("That ID does not look right. It has 6 letters and numbers.", 400);
  const raw = await getKey(`cs:${id}`);
  if (!raw) return err("Nothing found for that ID. It may be wrong, or it has expired.", 404);
  const r = JSON.parse(raw) as Rec;
  return NextResponse.json({ text: r.text, enc: r.enc ?? null, updated: r.updated, expires: r.exp }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase();
  if (!ID_RE.test(id) || typeof b?.token !== "string" || typeof b?.text !== "string" || !b.text.trim()) return err("Bad request.", 400);
  if (b.text.length > MAX_CHARS) return err("That is too long. The limit is about 100,000 characters.", 413);
  const raw = await getKey(`cs:${id}`); if (!raw) return err("This pad has expired.", 404);
  const r = JSON.parse(raw) as Rec;
  if (!same(r.token, b.token)) return err("Only the person who created this pad can change it.", 403);
  const left = Math.max(60, Math.round((r.exp - Date.now()) / 1000));
  const next: Rec = { ...r, text: b.text, enc: cleanEnc(b.enc), updated: Date.now() };
  await setKey(`cs:${id}`, JSON.stringify(next), left);
  return NextResponse.json({ updated: next.updated });
}

export async function DELETE(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase();
  const raw = ID_RE.test(id) ? await getKey(`cs:${id}`) : null;
  if (!raw) return NextResponse.json({ ok: true });
  if (typeof b?.token !== "string" || !same((JSON.parse(raw) as Rec).token, b.token)) return err("Only the person who created this pad can delete it.", 403);
  await delKey(`cs:${id}`);
  return NextResponse.json({ ok: true });
}
