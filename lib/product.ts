// The product card a shop owner publishes behind a QR code. These rules run in the browser (form) and on the server (API),
// so a hand-made request cannot slip in unsafe links or oversized data.
import { THEME_IDS, type ThemeId } from "./productThemes";

export interface Product {
  theme: ThemeId;                                                // look of the customer page and poster
  name: string; price: string; mrp: string; currency: string; desc: string; image: string;
  stock: "" | "in" | "limited" | "out"; offer: string; extra: { k: string; v: string }[];
  shop: string; website: string; whatsapp: string; phone: string; upi: string; address: string; email: string; instagram: string;
}

export const EMPTY_PRODUCT: Product = { theme: "clean", name: "", price: "", mrp: "", currency: "₹", desc: "", image: "", stock: "in", offer: "", extra: [], shop: "", website: "", whatsapp: "", phone: "", upi: "", address: "", email: "", instagram: "" };
export const CURRENCIES = ["₹", "$", "€", "£", "AED", "SAR", "৳", "Rs"];
export const MAX_IMAGE_CHARS = 260_000;                          // the photo is stored as a small JPEG data URL

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");

export function normalizeUrl(v: string): string {
  const t = v.trim(); if (!t) return "";
  try { const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`); return u.protocol === "http:" || u.protocol === "https:" ? (u.hostname.includes(".") ? u.toString() : "") : ""; } catch { return ""; }
}
export const digits = (v: string) => { const p = v.trim().startsWith("+") ? "+" : ""; const d = v.replace(/\D/g, ""); return d.length >= 7 && d.length <= 15 ? p + d : ""; };
const handle = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");

export function cleanProduct(raw: unknown): { ok: true; p: Product } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const p: Product = {
    theme: (THEME_IDS.includes(str(r.theme, 12)) ? str(r.theme, 12) : "clean") as ThemeId,
    name: str(r.name, 90), price: str(r.price, 20), mrp: str(r.mrp, 20), currency: CURRENCIES.includes(str(r.currency, 4)) ? str(r.currency, 4) : "₹",
    desc: str(r.desc, 1200), image: "", stock: (["in", "limited", "out", ""] as const).includes(r.stock as never) ? (r.stock as Product["stock"]) : "", offer: str(r.offer, 80),
    extra: (Array.isArray(r.extra) ? r.extra : []).slice(0, 5).map((e) => ({ k: str((e as Record<string, unknown>)?.k, 30), v: str((e as Record<string, unknown>)?.v, 80) })).filter((e) => e.k && e.v),
    shop: str(r.shop, 70), website: normalizeUrl(str(r.website, 300)), whatsapp: digits(str(r.whatsapp, 20)), phone: digits(str(r.phone, 20)),
    upi: str(r.upi, 60), address: str(r.address, 200), email: str(r.email, 100), instagram: handle(str(r.instagram, 100)),
  };
  if (!p.name) return { ok: false, error: "Add the product name." };
  if (typeof r.image === "string" && r.image) {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.image) || r.image.length > MAX_IMAGE_CHARS) return { ok: false, error: "The photo is not valid or is too big. Choose another photo." };
    p.image = r.image;
  }
  if (p.upi && !/^[\w.\-]{2,}@[a-zA-Z][a-zA-Z0-9]{1,}$/.test(p.upi)) return { ok: false, error: "The UPI ID looks wrong. It should look like name@bank." };
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return { ok: false, error: "The email address looks wrong." };
  if (p.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(p.instagram)) return { ok: false, error: "The Instagram name looks wrong." };
  if (str(r.website, 300) && !p.website) return { ok: false, error: "The website address looks wrong. Example: www.myshop.com" };
  return { ok: true, p };
}

const num = (s: string) => { const n = parseFloat(s.replace(/,/g, "").replace(/[^\d.]/g, "")); return isFinite(n) ? n : NaN; };
export const priceText = (p: Product, v = p.price) => (v ? (/^[\d.,\s]+$/.test(v) ? `${p.currency}${v}` : v) : "");
export const discount = (p: Product) => { const a = num(p.price), b = num(p.mrp); return a > 0 && b > a ? Math.round((1 - a / b) * 100) : 0; };

/** Buttons shown on the product page. Every link is built from already-cleaned values. */
export function actions(p: Product, pageUrl: string): { key: string; label: string; href: string; primary?: boolean }[] {
  const out: { key: string; label: string; href: string; primary?: boolean }[] = [];
  const msg = `Hi${p.shop ? " " + p.shop : ""}, I am interested in ${p.name}${p.price ? " (" + priceText(p) + ")" : ""}. ${pageUrl}`;
  if (p.whatsapp) out.push({ key: "wa", label: "Order on WhatsApp", href: `https://wa.me/${p.whatsapp.replace("+", "")}?text=${encodeURIComponent(msg)}`, primary: true });
  if (p.phone) out.push({ key: "call", label: "Call the shop", href: `tel:${p.phone}`, primary: !p.whatsapp });
  if (p.upi) { const a = p.currency === "₹" || p.currency === "Rs" ? num(p.price) : NaN; out.push({ key: "upi", label: "Pay with UPI", href: `upi://pay?pa=${encodeURIComponent(p.upi)}&pn=${encodeURIComponent(p.shop || p.name)}${a > 0 ? `&am=${a}` : ""}&cu=INR&tn=${encodeURIComponent(p.name.slice(0, 40))}` }); }
  if (p.website) out.push({ key: "web", label: "Visit website", href: p.website });
  if (p.address) out.push({ key: "map", label: "Get directions", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}` });
  if (p.instagram) out.push({ key: "ig", label: "Instagram", href: `https://instagram.com/${p.instagram}` });
  if (p.email) out.push({ key: "mail", label: "Email", href: `mailto:${p.email}?subject=${encodeURIComponent("About " + p.name)}` });
  return out;
}

// ---- "no storage" mode: the details travel inside the QR code itself (no photo) ----
const b64u = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const w = stream.writable.getWriter(); w.write(data as BufferSource); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
export async function packProduct(p: Product): Promise<string> {
  const { image, ...rest } = p; void image;
  const raw = new TextEncoder().encode(JSON.stringify(rest));
  try { return "z" + b64u(await pipe(raw, new CompressionStream("deflate-raw"))); } catch { return "j" + b64u(raw); }
}
export async function unpackProduct(s: string): Promise<Product | null> {
  try {
    const bytes = unb64u(s.slice(1)), raw = s[0] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
    const c = cleanProduct(JSON.parse(new TextDecoder().decode(raw))); return c.ok ? c.p : null;
  } catch { return null; }
}
