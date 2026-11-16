import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cleanProduct } from "@/lib/product";
import { delKey, getKey, setKey, storeUsable } from "@/lib/shareStore";

export const runtime = "nodejs";

const TTL = 365 * 24 * 3600;                                       // a product page stays for a year, and every edit renews it
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const ID_RE = /^[a-hj-km-np-z2-9]{8}$/;
const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const off = () => err("Product pages are not switched on yet on this site. The site owner needs to connect a storage (Vercel KV or Upstash).", 503);
const hits = new Map<string, number[]>();
const limited = (ip: string) => { const now = Date.now(), r = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000); r.push(now); hits.set(ip, r); return r.length > 25; };
const ip = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
interface Rec { p: unknown; token: string; created: number; updated: number }

export async function POST(req: NextRequest) {
  if (!storeUsable) return off();
  if (limited(ip(req))) return err("Too many pages created. Please try again in an hour.", 429);
  const b = await req.json().catch(() => null), c = cleanProduct(b?.product);
  if (!c.ok) return err(c.error, 400);
  const token = randomBytes(12).toString("hex"), now = Date.now();
  for (let i = 0; i < 8; i++) {
    const id = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    if (await setKey(`pc:${id}`, JSON.stringify({ p: c.p, token, created: now, updated: now } satisfies Rec), TTL, true)) return NextResponse.json({ id, token });
  }
  return err("Could not create the page. Please try again.", 500);
}

export async function GET(req: NextRequest) {
  if (!storeUsable) return off();
  const id = req.nextUrl.searchParams.get("id")?.toLowerCase().trim() ?? "";
  if (!ID_RE.test(id)) return err("This link does not look right.", 400);
  const raw = await getKey(`pc:${id}`);
  if (!raw) return err("This product page was not found. It may have been removed or expired.", 404);
  const r = JSON.parse(raw) as Rec;
  return NextResponse.json({ product: r.p, updated: r.updated }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase(), c = cleanProduct(b?.product);
  if (!ID_RE.test(id) || typeof b?.token !== "string") return err("Bad request.", 400);
  if (!c.ok) return err(c.error, 400);
  const raw = await getKey(`pc:${id}`); if (!raw) return err("This page has expired.", 404);
  const r = JSON.parse(raw) as Rec;
  if (!same(r.token, b.token)) return err("Only the person who created this page can change it.", 403);
  await setKey(`pc:${id}`, JSON.stringify({ ...r, p: c.p, updated: Date.now() } satisfies Rec), TTL);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase();
  const raw = ID_RE.test(id) ? await getKey(`pc:${id}`) : null;
  if (!raw) return NextResponse.json({ ok: true });
  if (typeof b?.token !== "string" || !same((JSON.parse(raw) as Rec).token, b.token)) return err("Only the person who created this page can delete it.", 403);
  await delKey(`pc:${id}`);
  return NextResponse.json({ ok: true });
}
