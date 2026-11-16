// The printable / WhatsApp-ready poster for a product, in three layouts and the colours of the chosen theme (browser only).
import { discount, priceText, type Product } from "./product";
import { themeOf } from "./productThemes";
import type { PosterLayout } from "./productTemplates";

const W = 1080, H = 1500;
const font = (w: number, s: number) => `${w} ${s}px Inter, Arial, Helvetica, sans-serif`;

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/), lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"; }
  return lines;
}
async function load(src: string): Promise<HTMLImageElement> { const i = new Image(); i.src = src; await i.decode(); return i; }
function cover(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k);
}
function pill(g: CanvasRenderingContext2D, text: string, cx: number, y: number, bg: string, ink: string, size = 38) {
  g.font = font(800, size); const w = g.measureText(text).width + size * 1.5, h = size * 1.75;
  g.fillStyle = bg; g.beginPath(); g.roundRect(cx - w / 2, y, w, h, h / 2); g.fill(); g.fillStyle = ink; g.textAlign = "center"; g.fillText(text, cx, y + h * 0.66); return h;
}
function priceLine(g: CanvasRenderingContext2D, p: Product, cx: number, baseline: number, size: number, ink: string, muted: string) {
  if (!p.price) return;
  g.font = font(800, size); const pt = priceText(p), pw = g.measureText(pt).width; let mt = "", mw = 0;
  if (p.mrp) { g.font = font(500, size * 0.52); mt = priceText(p, p.mrp); mw = g.measureText(mt).width + 26; }
  const x0 = cx - (pw + mw) / 2; g.textAlign = "left"; g.fillStyle = ink; g.font = font(800, size); g.fillText(pt, x0, baseline);
  if (p.mrp) { g.font = font(500, size * 0.52); g.fillStyle = muted; g.fillText(mt, x0 + pw + 26, baseline); g.fillRect(x0 + pw + 26, baseline - size * 0.2, g.measureText(mt).width, 3); }
  g.textAlign = "center";
}
const contact = (p: Product) => [p.whatsapp || p.phone, p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")].filter(Boolean).join("   •   ").slice(0, 60);
const offerText = (p: Product) => p.offer || (discount(p) > 0 ? `${discount(p)}% OFF` : "");

export async function makePoster(p: Product, qrPng: Blob, layout: PosterLayout = "classic", themeId: string = p.theme): Promise<Blob> {
  const T = themeOf(themeId), c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!;
  const q = await load(URL.createObjectURL(qrPng)), photo = p.image ? await load(p.image) : null, qr = q.width / q.height;
  g.textBaseline = "alphabetic"; g.textAlign = "center";
  const foot = (ink: string, soft: string) => { g.fillStyle = ink; g.font = font(600, 34); g.fillText(contact(p), W / 2, H - 80); g.fillStyle = soft; g.font = font(500, 26); g.fillText("Made with ToolBox · toolbox.otaga.in", W / 2, H - 36); };

  if (layout === "bold") {
    g.fillStyle = T.accent; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(W * 0.9, H * 0.08, 360, 0, 7); g.fill(); g.beginPath(); g.arc(W * 0.05, H * 0.62, 300, 0, 7); g.fill();
    let y = 60; if (p.shop) { g.fillStyle = T.accentInk; g.globalAlpha = 0.85; g.font = font(800, 40); g.fillText(p.shop.slice(0, 36).toUpperCase(), W / 2, y + 34); g.globalAlpha = 1; y += 80; }
    if (photo) { const r = 175, cy = y + r + 12; g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(W / 2, cy, r + 12, 0, 7); g.fill(); g.save(); g.beginPath(); g.arc(W / 2, cy, r, 0, 7); g.clip(); cover(g, photo, W / 2 - r, cy - r, r * 2, r * 2); g.restore(); y = cy + r + 50; } else y += 20;
    g.fillStyle = T.accentInk; g.font = font(900, 62); const nl = wrap(g, p.name, 920, 2); nl.forEach((l, i) => g.fillText(l, W / 2, y + 52 + i * 68)); y += nl.length * 68 + 32;
    if (p.price) { const t = priceText(p); g.font = font(900, 76); const w = g.measureText(t).width + 100; g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect((W - w) / 2, y, w, 112, 56); g.fill(); g.fillStyle = "#0a0a0a"; g.textAlign = "center"; g.fillText(t, W / 2, y + 82); y += 112 + 24; }
    const ot = offerText(p); if (ot) { g.fillStyle = T.accentInk; g.font = font(800, 36); g.fillText(ot.toUpperCase(), W / 2, y + 30); }
    const qs = 340, qw = qs * qr, cardH = qs + 56, by = H - 120 - cardH, bx = (W - qw) / 2 - 28; g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(bx, by, qw + 56, cardH, 40); g.fill(); g.drawImage(q, bx + 28, by + 28, qw, qs);
    foot(T.accentInk, T.accentInk);
  } else if (layout === "minimal") {
    g.fillStyle = T.card; g.fillRect(0, 0, W, H);
    let y = 70; if (p.shop) { g.fillStyle = T.muted; g.font = font(700, 38); g.fillText(p.shop.slice(0, 40).toUpperCase(), W / 2, y + 30); y += 70; }
    if (photo) { const s = 190, x = 90; g.save(); g.beginPath(); g.roundRect(x, y, s, s, 36); g.clip(); cover(g, photo, x, y, s, s); g.restore(); }
    const tx = photo ? 320 : 90, tw = photo ? W - tx - 70 : W - 180, cx = tx + tw / 2;           // text block beside the photo
    g.textAlign = "center"; g.fillStyle = T.ink; g.font = font(800, 56); const nl = wrap(g, p.name, tw, 2); nl.forEach((l, i) => g.fillText(l, cx, y + 64 + i * 64));
    priceLine(g, p, cx, y + 64 + nl.length * 64 + 70, 78, T.ink, T.muted);
    const priceBase = y + 64 + nl.length * 64 + 70; g.textAlign = "center"; y = Math.max(y + 210, priceBase + 36); const ot = offerText(p); if (ot) { y += pill(g, ot, W / 2, y, T.accent, T.accentInk, 34) + 30; }
    const gap = 50, qs = Math.min(H - y - 190 - gap, 820), qw = qs * qr; g.drawImage(q, (W - qw) / 2, y + gap + (H - 190 - y - gap - qs) / 2, qw, qs);   // keep clear space above the QR code so scanners find it
    foot(T.muted, T.muted);
  } else {
    g.fillStyle = T.card; g.fillRect(0, 0, W, H);
    let y = 70; if (p.shop) { g.fillStyle = T.muted; g.font = font(700, 40); g.fillText(p.shop.slice(0, 40).toUpperCase(), W / 2, y + 30); y += 70; }
    if (photo) { const bw = 880, bh = 560, x = (W - bw) / 2; g.save(); g.beginPath(); g.roundRect(x, y, bw, bh, 36); g.clip(); cover(g, photo, x, y, bw, bh); g.restore(); y += bh + 50; } else y += 20;
    g.fillStyle = T.ink; g.font = font(800, 62); const nl = wrap(g, p.name, 900, 2); nl.forEach((l, i) => g.fillText(l, W / 2, y + 56 + i * 70)); y += nl.length * 70 + 20;
    if (p.price) { priceLine(g, p, W / 2, y + 80, 84, T.ink, T.muted); y += 110; const ot = offerText(p); if (ot) y += pill(g, ot, W / 2, y, T.accent, T.accentInk) + 24; }
    const qs = Math.min(520, H - y - 190), qw = qs * qr; g.drawImage(q, (W - qw) / 2, H - 150 - qs, qw, qs);
    foot(T.muted, T.muted);
  }
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
}
