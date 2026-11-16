import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt } from "node:crypto";
import { cleanData, typeOf } from "@/lib/qrTypes";
import { TTL, dropImages, externalizeImages, refsIn, same, type Rec } from "@/lib/qrServer";
import { delKey, getKey, setKey, storeUsable } from "@/lib/shareStore";

export const runtime = "nodejs";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const ID_RE = /^[a-hj-km-np-z2-9]{8}$/;
const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const off = () => err("QR pages are not switched on yet on this site. The site owner needs to connect a storage (Vercel KV or Upstash).", 503);
const hits = new Map<string, number[]>();
const limited = (ip: string) => { const now = Date.now(), r = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000); r.push(now); hits.set(ip, r); return r.length > 30; };
const ip = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

export async function POST(req: NextRequest) {
  if (!storeUsable) return off();
  if (limited(ip(req))) return err("Too many pages created. Please try again in an hour.", 429);
  const b = await req.json().catch(() => null), t = typeOf(b?.type);
  if (!t || t.staticText && !t.hostedWhen) return err("That QR type does not need a page.", 400);
  const c = cleanData(t, b?.data); if (!c.ok) return err(c.error, 400);
  const token = randomBytes(12).toString("hex"), now = Date.now();
  for (let i = 0; i < 8; i++) {
    const id = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    if (!(await setKey(`qp:${id}`, JSON.stringify({ type: t.id, d: {}, token, created: now, updated: now } satisfies Rec), TTL, true))) continue;   // reserve the id
    const d = await externalizeImages(id, t, c.d);
    await setKey(`qp:${id}`, JSON.stringify({ type: t.id, d, token, created: now, updated: now } satisfies Rec), TTL);
    return NextResponse.json({ id, token });
  }
  return err("Could not create the page. Please try again.", 500);
}

/** Public: the page content. With ?key= (the edit key) it is the owner opening their page to edit. */
export async function GET(req: NextRequest) {
  if (!storeUsable) return off();
  const id = req.nextUrl.searchParams.get("id")?.toLowerCase().trim() ?? "", key = req.nextUrl.searchParams.get("key");
  if (!ID_RE.test(id)) return err("This link does not look right.", 400);
  const raw = await getKey(`qp:${id}`);
  if (!raw) return err("This page was not found. It may have been removed or expired.", 404);
  const r = JSON.parse(raw) as Rec;
  if (key !== null && !same(r.token, key)) return err("That edit link is not valid.", 403);
  return NextResponse.json({ type: r.type, data: r.d, updated: r.updated, ...(key !== null ? { editable: true } : {}) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase();
  if (!ID_RE.test(id) || typeof b?.token !== "string") return err("Bad request.", 400);
  const raw = await getKey(`qp:${id}`); if (!raw) return err("This page has expired.", 404);
  const r = JSON.parse(raw) as Rec, t = typeOf(r.type)!;
  if (!same(r.token, b.token)) return err("Only the person who created this page can change it.", 403);
  const c = cleanData(t, b?.data); if (!c.ok) return err(c.error, 400);
  const d = await externalizeImages(id, t, c.d), keep = new Set(refsIn(t, d));
  await setKey(`qp:${id}`, JSON.stringify({ ...r, d, updated: Date.now() } satisfies Rec), TTL);
  await dropImages(id, refsIn(t, r.d).filter((x) => !keep.has(x)));                 // pictures the owner removed
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!storeUsable) return off();
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase();
  const raw = ID_RE.test(id) ? await getKey(`qp:${id}`) : null;
  if (!raw) return NextResponse.json({ ok: true });
  if (typeof b?.token !== "string" || !same((JSON.parse(raw) as Rec).token, b.token)) return err("Only the person who created this page can delete it.", 403);
  const rec = JSON.parse(raw) as Rec, t = typeOf(rec.type);
  if (t) await dropImages(id, refsIn(t, rec.d));
  await delKey(`qp:${id}`); await delKey(`qf:${id}`);
  return NextResponse.json({ ok: true });
}
