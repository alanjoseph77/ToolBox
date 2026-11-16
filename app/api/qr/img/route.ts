import { NextRequest, NextResponse } from "next/server";
import { getKey, storeUsable } from "@/lib/shareStore";

export const runtime = "nodejs";

/** One stored picture of a QR page. Kept by browsers and the CDN for one hour only, so a deleted picture disappears quickly. */
export async function GET(req: NextRequest) {
  if (!storeUsable) return new NextResponse("Not available", { status: 503 });
  const id = req.nextUrl.searchParams.get("id") ?? "", h = req.nextUrl.searchParams.get("h") ?? "";
  if (!/^[a-hj-km-np-z2-9]{8}$/.test(id) || !/^[0-9a-f]{12}$/.test(h)) return new NextResponse("Bad request", { status: 400 });
  const raw = await getKey(`qm:${id}:${h}`), m = raw ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(raw) : null;
  if (!m) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(m[1], "base64"), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=3600", "X-Content-Type-Options": "nosniff" } });
}
