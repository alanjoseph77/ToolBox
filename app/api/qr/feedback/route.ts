import { NextRequest, NextResponse } from "next/server";
import { getKey, setKey, storeUsable } from "@/lib/shareStore";
import { same, type Rec } from "@/lib/qrServer";

export const runtime = "nodejs";

const TTL = 365 * 24 * 3600, ID_RE = /^[a-hj-km-np-z2-9]{8}$/, MAX_ENTRIES = 300;
const err = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const hits = new Map<string, number[]>();
const limited = (ip: string) => { const now = Date.now(), r = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000); r.push(now); hits.set(ip, r); return r.length > 20; };
interface Entry { r: number; c: string; n: string; t: number }
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");

/** A customer sends a rating and an optional comment. */
export async function POST(req: NextRequest) {
  if (!storeUsable) return err("Feedback is not switched on yet on this site.", 503);
  if (limited(req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local")) return err("Too many answers from this device. Please try again later.", 429);
  const b = await req.json().catch(() => null), id = String(b?.id ?? "").toLowerCase(), rating = Number(b?.rating);
  if (!ID_RE.test(id) || !Number.isInteger(rating) || rating < 1 || rating > 5) return err("Please choose 1 to 5 stars.", 400);
  const raw = await getKey(`qp:${id}`); if (!raw || (JSON.parse(raw) as Rec).type !== "feedback") return err("This feedback page was not found.", 404);
  const list: Entry[] = JSON.parse((await getKey(`qf:${id}`)) ?? "[]");
  list.push({ r: rating, c: clean(b?.comment, 600), n: clean(b?.name, 60), t: Date.now() });
  await setKey(`qf:${id}`, JSON.stringify(list.slice(-MAX_ENTRIES)), TTL);
  return NextResponse.json({ ok: true });
}

/** The page owner reads the answers (needs the edit key). */
export async function GET(req: NextRequest) {
  if (!storeUsable) return err("Feedback is not switched on yet on this site.", 503);
  const id = req.nextUrl.searchParams.get("id")?.toLowerCase() ?? "", key = req.nextUrl.searchParams.get("key") ?? "";
  const raw = ID_RE.test(id) ? await getKey(`qp:${id}`) : null;
  if (!raw) return err("Page not found.", 404);
  if (!same((JSON.parse(raw) as Rec).token, key)) return err("Only the page owner can read the answers.", 403);
  const list: Entry[] = JSON.parse((await getKey(`qf:${id}`)) ?? "[]");
  const avg = list.length ? list.reduce((a, e) => a + e.r, 0) / list.length : 0;
  return NextResponse.json({ count: list.length, average: Math.round(avg * 10) / 10, entries: list.slice().reverse() }, { headers: { "Cache-Control": "no-store" } });
}
