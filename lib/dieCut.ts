// Die-cut card maker: turns a picture with a transparent background into a sticker, a fold-out QR card or a hanger,
// with a white border and a cut line. Everything is drawn on canvases in the browser; nothing is uploaded.
import QRCode from "qrcode";
import { THEMES } from "./doorHanger";

export type CardMode = "book" | "band" | "sticker" | "fold" | "hanger";
export interface Pic { src: CanvasImageSource; w: number; h: number }
export type Design = "classic" | "bold" | "minimal" | "dark" | "offer" | "contact" | "gallery" | "coupon";
export const DESIGNS: { id: Design; name: string }[] = [
  { id: "classic", name: "Phone + QR" }, { id: "bold", name: "Bold colour" }, { id: "minimal", name: "Clean white" }, { id: "dark", name: "Dark gold" },
  { id: "offer", name: "Big offer" }, { id: "contact", name: "Contact card" }, { id: "gallery", name: "Photo gallery" }, { id: "coupon", name: "Coupon ticket" },
];
export interface CardOpts {
  mode: CardMode; border: number;                  // white border as % of the picture height
  theme: string; shop: string; sub: string; phone: string; cta: string;
  qr: string; badge: boolean; flip: boolean;       // badge: QR badge on a plain sticker; flip: panel on the left
  handle: string; logo: Pic | null; shot: Pic | null;   // book card: name on the phone, brand logo, screenshot of the profile
  address: string; offer: string; design: Design; midW: number; posts: string; followers: string; following: string; photos: Pic[]; qrIcon: "insta" | "logo" | "none";   // phone page numbers, product photos for the grid, picture in the middle of the QR
}
export const CARD_DEFAULTS: CardOpts = { mode: "book", border: 3, theme: "green", shop: "Your shop name", sub: "Follow us and order online", phone: "", cta: "SCAN ME", qr: "", badge: false, flip: false, handle: "yourshop", logo: null, shot: null, address: "", offer: "20% OFF", design: "classic", midW: 1, posts: "120", followers: "4,532", following: "12", photos: [], qrIcon: "none" };
export const SAMPLE_QR = "https://yourshop.in";

type Matrix = { size: number; get(r: number, c: number): number };
const matrix = (t: string, ecc: "M" | "H" = "M"): Matrix => QRCode.create(t || " ", { errorCorrectionLevel: ecc }).modules as unknown as Matrix;
const FONT = (w: number, px: number) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

/** Crops a picture with a transparent background to its content and limits its size. */
export function prepareFigure(src: CanvasImageSource, sw: number, sh: number, maxSide = 1400): HTMLCanvasElement {
  const k = Math.min(1, maxSide / Math.max(sw, sh)), c = mk(sw * k, sh * k), g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(src, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const o = mk(x1 - x0 + 1, y1 - y0 + 1); o.getContext("2d")!.drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
}

/** Does this image already have a transparent background? (a PNG cut-out) */
export function hasTransparency(c: CanvasImageSource, w: number, h: number): boolean {
  const k = Math.min(1, 300 / Math.max(w, h)), t = mk(w * k, h * k), g = t.getContext("2d", { willReadFrequently: true })!; g.drawImage(c, 0, 0, t.width, t.height);
  const d = g.getImageData(0, 0, t.width, t.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 200) n++;
  return n / (t.width * t.height) > 0.02;
}

/** A white silhouette of the picture grown outwards by r pixels (the sticker border). */
function halo(fig: HTMLCanvasElement, r: number): { c: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(r) + 4, sil = mk(fig.width, fig.height), sg = sil.getContext("2d")!;
  sg.drawImage(fig, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#fff"; sg.fillRect(0, 0, sil.width, sil.height);
  const out = mk(fig.width + 2 * pad, fig.height + 2 * pad), g = out.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(sil, pad, pad);
  for (const f of [1, 0.8, 0.6, 0.4, 0.2]) { const n = Math.max(16, Math.round(44 * f)); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.drawImage(sil, pad + Math.cos(a) * r * f, pad + Math.sin(a) * r * f); } }
  const id = g.getImageData(0, 0, out.width, out.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i + 3] > 110 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = 255; }
  g.putImageData(id, 0, 0); return { c: out, pad };
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []; let line = "";
  for (const w of text.split(/\s+/).filter(Boolean)) { const t = line ? line + " " + w : w; if (g.measureText(t).width <= maxW || !line) line = t; else { out.push(line); line = w; } }
  if (line) out.push(line); return out;
}

type Icon = ((g: CanvasRenderingContext2D, cx: number, cy: number, s: number) => void) | null;
function qrCard(g: CanvasRenderingContext2D, text: string, x: number, y: number, s: number, accent: string, icon: Icon = null) {
  g.save(); g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x, y, s, s, s * 0.1); g.fill();
  g.lineWidth = Math.max(3, s * 0.035); g.strokeStyle = accent; g.stroke();
  const mx = matrix(text || SAMPLE_QR, icon ? "H" : "M"), n = mx.size, pad = s * 0.07, ms = (s - 2 * pad) / (n + 2);
  g.fillStyle = "#0a0a0a"; const qx = x + pad + ms, qy = y + pad + ms, mid = (n - 1) / 2, clear = Math.ceil(n * 0.115);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (icon && Math.abs(r - mid) <= clear && Math.abs(c - mid) <= clear) continue; if (mx.get(r, c)) g.fillRect(qx + c * ms - 0.2, qy + r * ms - 0.2, ms + 0.4, ms + 0.4); }
  if (icon) { const cs = (clear * 2 + 1) * ms; g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x + s / 2 - cs / 2 - ms * 0.4, y + s / 2 - cs / 2 - ms * 0.4, cs + ms * 0.8, cs + ms * 0.8, ms * 1.6); g.fill(); icon(g, x + s / 2, y + s / 2, cs * 0.92); }
  g.restore();
}
/** A camera-style badge for QR codes that open an Instagram profile. */
const instaIcon: Icon = (g, cx, cy, s) => {
  const gr = g.createLinearGradient(cx - s / 2, cy + s / 2, cx + s / 2, cy - s / 2); gr.addColorStop(0, "#fdc830"); gr.addColorStop(0.45, "#ee2a7b"); gr.addColorStop(1, "#6228d7");
  g.save(); g.fillStyle = gr; g.beginPath(); g.roundRect(cx - s / 2, cy - s / 2, s, s, s * 0.28); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = s * 0.075; g.beginPath(); g.roundRect(cx - s * 0.3, cy - s * 0.3, s * 0.6, s * 0.6, s * 0.17); g.stroke();
  g.beginPath(); g.arc(cx, cy, s * 0.14, 0, 7); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(cx + s * 0.2, cy - s * 0.2, s * 0.04, 0, 7); g.fill(); g.restore();
};
const logoIcon = (l: Pic): Icon => (g, cx, cy, s) => { const k = Math.min(s / l.w, s / l.h); g.drawImage(l.src, cx - (l.w * k) / 2, cy - (l.h * k) / 2, l.w * k, l.h * k); };
/** Two simple leaves, a soft decoration for a corner of the QR page. */
function leaves(g: CanvasRenderingContext2D, x: number, y: number, s: number, flip: boolean, col: string) {
  g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.fillStyle = col;
  for (const [a, k] of [[-0.35, 1], [-0.95, 0.75]]) { g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(s * 0.28 * k, -s * 0.12 * k, s * 0.34 * k, -s * 0.5 * k, 0, -s * 0.62 * k); g.bezierCurveTo(-s * 0.3 * k, -s * 0.46 * k, -s * 0.22 * k, -s * 0.1 * k, 0, 0); g.fill(); g.restore(); }
  g.restore();
}
function pill(g: CanvasRenderingContext2D, text: string, cx: number, cy: number, h: number, bg: string, fg: string) {
  g.save(); g.font = FONT(900, h * 0.52); const w = g.measureText(text).width + h * 0.9;
  g.fillStyle = bg; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.3); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cx, cy + h * 0.03); g.restore();
}


/** A phone showing a screenshot of the profile, or a clean profile page built from the words and photos given. */
function drawPhone(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOpts, th: { bg: string; fg: string; accent: string }) {
  g.save(); g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = w * 0.06; g.shadowOffsetY = w * 0.025;
  g.fillStyle = "#101113"; g.beginPath(); g.roundRect(x, y, w, h, w * 0.13); g.fill(); g.shadowColor = "transparent";
  const m = w * 0.035, sx = x + m, sy = y + m, sw = w - 2 * m, sh = h - 2 * m, rad = w * 0.105;
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, rad); g.clip(); g.fillStyle = "#fff"; g.fillRect(sx, sy, sw, sh);
  if (o.shot) { const k = Math.max(sw / o.shot.w, sh / o.shot.h); g.drawImage(o.shot.src, sx + (sw - o.shot.w * k) / 2, sy, o.shot.w * k, o.shot.h * k); }
  else {
    const u = sw / 100; g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.fillStyle = "#111"; g.font = FONT(700, 7 * u); g.fillText("‹", sx + 6 * u, sy + 19 * u); g.font = FONT(800, 5.4 * u); g.fillText((o.handle || "yourshop").slice(0, 18), sx + 15 * u, sy + 18.6 * u);
    const ay = sy + 38 * u, ar = 11 * u;
    const ring = g.createLinearGradient(sx + 9 * u, ay + ar, sx + 31 * u, ay - ar); ring.addColorStop(0, "#fdc830"); ring.addColorStop(0.5, "#ee2a7b"); ring.addColorStop(1, "#6228d7");
    g.strokeStyle = ring; g.lineWidth = 1.6 * u; g.beginPath(); g.arc(sx + 20 * u, ay, ar, 0, 7); g.stroke();
    g.fillStyle = th.bg; g.beginPath(); g.arc(sx + 20 * u, ay, ar - 2.2 * u, 0, 7); g.fill();
    if (o.logo) { g.save(); g.beginPath(); g.arc(sx + 20 * u, ay, ar - 2.2 * u, 0, 7); g.clip(); g.fillStyle = "#fff"; g.fillRect(sx + 8 * u, ay - 12 * u, 24 * u, 24 * u); const k = Math.min(15 * u / o.logo.w, 15 * u / o.logo.h); g.drawImage(o.logo.src, sx + 20 * u - (o.logo.w * k) / 2, ay - (o.logo.h * k) / 2, o.logo.w * k, o.logo.h * k); g.restore(); }
    else { g.fillStyle = th.fg; g.font = FONT(900, 10 * u); g.textAlign = "center"; g.fillText((o.shop.trim()[0] || "Y").toUpperCase(), sx + 20 * u, ay + 3.6 * u); }
    g.textAlign = "center"; const stats: [string, string][] = [[o.posts, "Posts"], [o.followers, "Followers"], [o.following, "Following"]];
    stats.forEach(([v, l], i) => { const cx = sx + (50 + i * 22) * u; g.fillStyle = "#111"; g.font = FONT(800, 5 * u); g.fillText(v.trim().slice(0, 7) || "–", cx, ay - 1 * u); g.fillStyle = "#555"; g.font = FONT(500, 3.4 * u); g.fillText(l, cx, ay + 4.6 * u); });
    g.textAlign = "left"; g.fillStyle = "#111"; g.font = FONT(800, 4.8 * u); g.fillText(o.shop.trim().slice(0, 24) || "Your shop name", sx + 6 * u, sy + 62 * u);
    g.fillStyle = "#444"; g.font = FONT(500, 4.2 * u); let by = sy + 68.6 * u; for (const l of wrap(g, o.sub.trim() || "Follow us for new things", 88 * u).slice(0, 2)) { g.fillText(l, sx + 6 * u, by); by += 5.4 * u; }
    const bY = sy + 80 * u; g.fillStyle = th.bg; g.beginPath(); g.roundRect(sx + 6 * u, bY, 42 * u, 9.5 * u, 2.4 * u); g.fill(); g.fillStyle = th.fg; g.font = FONT(800, 4.2 * u); g.textAlign = "center"; g.fillText("Follow", sx + 27 * u, bY + 6.4 * u);
    g.fillStyle = "#e9e9eb"; g.beginPath(); g.roundRect(sx + 52 * u, bY, 42 * u, 9.5 * u, 2.4 * u); g.fill(); g.fillStyle = "#111"; g.fillText("Message", sx + 73 * u, bY + 6.4 * u);
    ["Products", "About", "Reviews", "Offers"].forEach((t, i) => { const cx = sx + (16 + i * 23) * u, cy = sy + 101 * u; g.fillStyle = "#f1ece0"; g.beginPath(); g.arc(cx, cy, 7 * u, 0, 7); g.fill(); g.strokeStyle = th.bg; g.lineWidth = 0.9 * u; g.beginPath(); g.arc(cx, cy, 2.6 * u, 0, 7); g.stroke(); g.fillStyle = "#333"; g.font = FONT(500, 3.1 * u); g.fillText(t, cx, cy + 11.3 * u); });
    const gy = sy + 116 * u, tw = sw / 3, tint = [th.bg, "#d4d4d8", th.accent, "#e5e5e5", "#d4d4d8", th.bg];
    for (let i = 0; i < 6; i++) { const tx = sx + (i % 3) * tw, ty = gy + Math.floor(i / 3) * tw; g.save(); g.beginPath(); g.rect(tx + 0.5 * u, ty + 0.5 * u, tw - 1 * u, tw - 1 * u); g.clip(); const ph = o.photos[i]; if (ph) { const k = Math.max(tw / ph.w, tw / ph.h); g.drawImage(ph.src, tx + (tw - ph.w * k) / 2, ty + (tw - ph.h * k) / 2, ph.w * k, ph.h * k); } else { g.globalAlpha = 0.5; g.fillStyle = tint[i]; g.fillRect(tx, ty, tw, tw); g.globalAlpha = 1; } g.restore(); }
  }
  g.restore();
  g.fillStyle = "#101113"; g.beginPath(); g.roundRect(x + w * 0.31, y + m * 0.85, w * 0.38, m * 1.6, m); g.fill(); g.restore();
}


type Th = { bg: string; fg: string; accent: string };
const iconOf = (o: CardOpts): Icon => o.qrIcon === "insta" ? instaIcon : o.qrIcon === "logo" && o.logo ? logoIcon(o.logo) : null;
/** Logo, or the shop name when there is no logo. Returns the y below it. */
function brand(g: CanvasRenderingContext2D, o: CardOpts, cx: number, top: number, maxW: number, maxH: number, color: string, align: CanvasTextAlign = "center"): number {
  if (o.logo) { const k = Math.min(maxW / o.logo.w, maxH / o.logo.h), w = o.logo.w * k, x = align === "center" ? cx - w / 2 : cx; g.drawImage(o.logo.src, x, top, w, o.logo.h * k); return top + o.logo.h * k; }
  const nm = (o.shop || "").trim() || " "; let fs = maxH * 0.7; g.font = FONT(900, fs);
  let lines = wrap(g, nm, maxW); while ((lines.length > 2 || lines.some((l) => g.measureText(l).width > maxW) || lines.length * fs * 1.05 > maxH) && fs > 10) { fs -= 1; g.font = FONT(900, fs); lines = wrap(g, nm, maxW); }
  g.fillStyle = color; g.textAlign = align; let y = top; for (const l of lines) { g.fillText(l, cx, y + fs * 0.86); y += fs * 1.05; } return y;
}
function textLines(g: CanvasRenderingContext2D, text: string, cx: number, top: number, maxW: number, size: number, weight: number, color: string, max = 3, align: CanvasTextAlign = "center"): number {
  if (!text.trim()) return top; g.font = FONT(weight, size); g.fillStyle = color; g.textAlign = align; let y = top;
  for (const l of wrap(g, text.trim(), maxW).slice(0, max)) { g.fillText(l, cx, y + size); y += size * 1.3; } return y;
}
function qrBlock(g: CanvasRenderingContext2D, o: CardOpts, cx: number, top: number, s: number, frame: string, pillBg: string, pillFg: string): number {
  qrCard(g, o.qr, cx - s / 2, top, s, frame, iconOf(o)); const ph = Math.max(20, s * 0.2);
  pill(g, (o.cta || "SCAN ME").slice(0, 14), cx, top + s + ph * 0.85, ph, pillBg, pillFg); return top + s + ph * 1.4;
}
function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, color: string) {
  g.fillStyle = color; g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.84 : r; g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill();
}

/** The long middle panel (the inside of the card), in one of the designs. */
export function drawMiddle(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOpts, th: Th, rad: number) {
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, rad); g.clip();
  const pg = w / 2, lx = x + pg / 2, rx = x + pg + pg / 2, d = o.design;
  const qs = (top: number, room: number) => Math.max(20, Math.min(pg * 0.8, room));
  if (d === "classic" || d === "dark" || d === "gallery") {
    const dark = d === "dark", gold = "#d4af37";
    g.fillStyle = dark ? "#121214" : "#f7f2e6"; g.fillRect(x, y, w, h);
    if (d === "gallery") {
      const gw = pg * 0.86, cols = 2, rows = 3, gap = gw * 0.04, tw = (gw - gap) / cols, th2 = Math.min(tw, (h * 0.88 - gap * 2) / rows), gx = lx - gw / 2, gy = y + (h - (th2 * rows + gap * 2)) / 2;
      const tint = [th.bg, "#d6d3d1", th.accent, "#e7e5e4", "#d6d3d1", th.bg];
      for (let i = 0; i < 6; i++) { const cx0 = gx + (i % cols) * (tw + gap), cy0 = gy + Math.floor(i / cols) * (th2 + gap); g.save(); g.beginPath(); g.roundRect(cx0, cy0, tw, th2, tw * 0.1); g.clip(); const p = o.photos[i]; if (p) { const k = Math.max(tw / p.w, th2 / p.h); g.drawImage(p.src, cx0 + (tw - p.w * k) / 2, cy0 + (th2 - p.h * k) / 2, p.w * k, p.h * k); } else { g.globalAlpha = 0.45; g.fillStyle = tint[i]; g.fillRect(cx0, cy0, tw, th2); g.globalAlpha = 1; } g.restore(); }
    } else { const pW = Math.min(h * 0.9 * 0.47, pg * 0.8), pH = pW / 0.47; drawPhone(g, lx - pW / 2, y + (h - pH) / 2, pW, pH, o, th); }
    if (!dark) { leaves(g, x + pg + pg * 0.05, y + h * 0.975, pg * 0.3, false, th.bg + "55"); leaves(g, x + w - pg * 0.05, y + h * 0.975, pg * 0.26, true, th.bg + "55"); }
    let ty = brand(g, o, rx, y + h * 0.06, pg * 0.8, h * 0.17, dark ? gold : th.bg) + h * 0.02;
    if (o.sub.trim()) { const ss = Math.min(h * 0.034, pg * 0.07); g.font = FONT(600, ss); const t = o.sub.trim().slice(0, 40), tw = g.measureText(t).width, ly = ty + ss * 0.8; g.textAlign = "center"; g.fillStyle = dark ? "#e7e5e4" : "#2f2a22"; g.fillText(t, rx, ly + ss * 0.3); g.strokeStyle = dark ? gold : th.bg; g.lineWidth = Math.max(2, ss * 0.1); const gp = ss * 0.7; for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(rx + sg * (tw / 2 + gp), ly); g.lineTo(rx + sg * Math.min(pg * 0.46, tw / 2 + gp + pg * 0.1), ly); g.stroke(); } ty += ss * 1.9; }
    const s2 = qs(ty, Math.min(pg * 0.82, y + h - ty - h * 0.17)); qrBlock(g, o, rx, ty + h * 0.01, s2, dark ? gold : th.bg, dark ? gold : th.bg, dark ? "#121214" : th.fg);
  } else if (d === "bold") {
    g.fillStyle = th.bg; g.fillRect(x, y, w, h); g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(x + pg * 0.2, y + h * 0.15, pg * 0.55, 0, 7); g.fill(); g.beginPath(); g.arc(x + pg * 0.95, y + h * 1.05, pg * 0.45, 0, 7); g.fill();
    let ty = y + h * 0.18; ty = brand(g, o, lx, ty, pg * 0.84, h * 0.3, th.fg) + h * 0.04;
    ty = textLines(g, o.sub, lx, ty, pg * 0.84, Math.min(h * 0.05, pg * 0.08), 700, th.accent, 3) + h * 0.03;
    for (const l of [o.phone, o.address, o.handle ? "@" + o.handle.replace(/^@/, "") : ""].filter((v) => v.trim())) ty = textLines(g, l, lx, ty, pg * 0.84, Math.min(h * 0.038, pg * 0.065), 600, th.fg, 1);
    const s2 = Math.min(pg * 0.74, h * 0.6); qrBlock(g, o, rx, y + (h - s2 * 1.28) / 2, s2, th.fg, th.accent, th.bg);
  } else if (d === "minimal") {
    g.fillStyle = "#ffffff"; g.fillRect(x, y, w, h); g.strokeStyle = "#e7e5e4"; g.lineWidth = Math.max(1.5, w * 0.003); g.beginPath(); g.moveTo(x + pg, y + h * 0.15); g.lineTo(x + pg, y + h * 0.85); g.stroke();
    let ty = y + h * 0.26; ty = brand(g, o, lx, ty, pg * 0.76, h * 0.22, "#0a0a0a") + h * 0.04;
    g.fillStyle = th.bg; g.fillRect(lx - pg * 0.08, ty, pg * 0.16, Math.max(2, h * 0.008)); ty += h * 0.05;
    ty = textLines(g, o.sub, lx, ty, pg * 0.76, Math.min(h * 0.04, pg * 0.068), 500, "#57534e", 3);
    if (o.handle.trim()) textLines(g, "@" + o.handle.replace(/^@/, ""), lx, ty + h * 0.02, pg * 0.76, Math.min(h * 0.036, pg * 0.06), 700, th.bg, 1);
    const s2 = Math.min(pg * 0.7, h * 0.6); qrCard(g, o.qr, rx - s2 / 2, y + (h - s2) / 2 - h * 0.04, s2, "#0a0a0a", iconOf(o));
    (g as unknown as { letterSpacing: string }).letterSpacing = "4px"; textLines(g, (o.cta || "SCAN ME").toUpperCase(), rx, y + (h + s2) / 2, pg * 0.8, Math.min(h * 0.04, pg * 0.06), 800, "#0a0a0a", 1); (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
  } else if (d === "offer") {
    g.fillStyle = "#fff8ec"; g.fillRect(x, y, w, h);
    const sr = Math.min(pg * 0.43, h * 0.33), sy = y + h * 0.42; star(g, lx, sy, sr, 16, th.bg);
    const off = (o.offer || "").trim() || "OFFER"; let fs = sr * 0.5; g.font = FONT(900, fs); let ol = wrap(g, off, sr * 1.45); while ((ol.length > 2 || ol.some((l) => g.measureText(l).width > sr * 1.45)) && fs > 10) { fs -= 1; g.font = FONT(900, fs); ol = wrap(g, off, sr * 1.45); }
    g.fillStyle = th.fg; g.textAlign = "center"; ol.forEach((l, i) => g.fillText(l, lx, sy - ((ol.length - 1) * fs * 1.0) / 2 + i * fs * 1.0 + fs * 0.35));
    textLines(g, o.sub, lx, sy + sr + h * 0.04, pg * 0.84, Math.min(h * 0.042, pg * 0.07), 700, "#292524", 2);
    let ty = brand(g, o, rx, y + h * 0.07, pg * 0.8, h * 0.13, th.bg) + h * 0.03;
    const s2 = Math.min(pg * 0.76, y + h - ty - h * 0.15); qrBlock(g, o, rx, ty, s2, th.bg, th.bg, th.fg);
  } else if (d === "contact") {
    g.fillStyle = "#ffffff"; g.fillRect(x, y, w, h); g.fillStyle = th.bg; g.fillRect(x, y, w * 0.025, h);
    let ty = y + h * 0.12; ty = brand(g, o, x + pg * 0.14, ty, pg * 0.78, h * 0.18, th.bg, "left") + h * 0.02;
    ty = textLines(g, o.sub, x + pg * 0.14, ty, pg * 0.78, Math.min(h * 0.038, pg * 0.064), 500, "#57534e", 2, "left") + h * 0.05;
    const rows: [string, string][] = [["☎", o.phone], ["⌂", o.address], ["@", o.handle.replace(/^@/, "")]];
    const fs = Math.min(h * 0.04, pg * 0.066);
    for (const [ic, v] of rows) { if (!v.trim()) continue; g.fillStyle = th.bg; g.beginPath(); g.arc(x + pg * 0.14 + fs * 0.75, ty + fs * 0.6, fs * 0.8, 0, 7); g.fill(); g.fillStyle = th.fg; g.font = FONT(800, fs * 0.9); g.textAlign = "center"; g.fillText(ic, x + pg * 0.14 + fs * 0.75, ty + fs * 0.92); g.textAlign = "left"; g.fillStyle = "#1c1917"; g.font = FONT(600, fs); let t = v.trim(); while (g.measureText(t).width > pg * 0.74 && t.length > 3) t = t.slice(0, -2); g.fillText(t, x + pg * 0.14 + fs * 2.1, ty + fs); ty += fs * 2.1; }
    const s2 = Math.min(pg * 0.72, h * 0.58); qrBlock(g, o, rx, y + (h - s2 * 1.28) / 2, s2, th.bg, th.bg, th.fg);
  } else if (d === "coupon") {
    g.fillStyle = th.bg; g.fillRect(x, y, w, h);
    const m = Math.min(w, h) * 0.05, cx0 = x + m, cy0 = y + m, cw = w - 2 * m, chh = h - 2 * m;
    g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(cx0, cy0, cw, chh, m); g.fill();
    g.strokeStyle = th.bg; g.lineWidth = Math.max(2, m * 0.12); g.setLineDash([m * 0.5, m * 0.35]); g.beginPath(); g.roundRect(cx0 + m * 0.5, cy0 + m * 0.5, cw - m, chh - m, m * 0.7); g.stroke();
    g.beginPath(); g.moveTo(x + pg, cy0 + m); g.lineTo(x + pg, cy0 + chh - m); g.stroke(); g.setLineDash([]);
    g.fillStyle = th.bg; for (const yy of [cy0, cy0 + chh]) { g.beginPath(); g.arc(x + pg, yy, m * 1.1, 0, 7); g.fill(); }
    (g as unknown as { letterSpacing: string }).letterSpacing = "5px"; let ty = textLines(g, "COUPON", lx, y + h * 0.16, pg * 0.8, Math.min(h * 0.04, pg * 0.06), 800, "#78716c", 1); (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
    const off = (o.offer || "").trim() || "OFFER"; let fs = Math.min(h * 0.18, pg * 0.26); g.font = FONT(900, fs); let ol = wrap(g, off, pg * 0.68); while ((ol.length > 2 || ol.some((l) => g.measureText(l).width > pg * 0.68)) && fs > 10) { fs -= 1; g.font = FONT(900, fs); ol = wrap(g, off, pg * 0.68); }
    g.fillStyle = th.bg; g.textAlign = "center"; ty += h * 0.03; for (const l of ol) { g.fillText(l, lx, ty + fs * 0.85); ty += fs * 1.02; }
    ty = textLines(g, o.sub, lx, ty + h * 0.02, pg * 0.8, Math.min(h * 0.04, pg * 0.066), 600, "#44403c", 2);
    brand(g, o, lx, Math.max(ty + h * 0.03, y + h * 0.74), pg * 0.6, h * 0.1, "#1c1917");
    const s2 = Math.min(pg * 0.7, h * 0.56); qrBlock(g, o, rx, y + (h - s2 * 1.28) / 2, s2, th.bg, th.bg, th.fg);
  }
  g.restore();
}

/** A small picture of one design (for the design picker). */
export function drawDesignThumb(c: HTMLCanvasElement, design: Design, o: CardOpts) {
  const th = THEMES.find((t) => t.id === o.theme) ?? THEMES[0], g = c.getContext("2d")!; g.clearRect(0, 0, c.width, c.height);
  drawMiddle(g, 0, 0, c.width, c.height, { ...o, design, qr: o.qr || SAMPLE_QR }, th, c.height * 0.06);
}

export interface Built { art: HTMLCanvasElement; hole: { x: number; y: number; r: number } | null; crease: { x: number; y0: number; y1: number; x2?: number } | null; safe?: { x: number; y: number; w: number; h: number }; closed?: HTMLCanvasElement }

/** Builds the finished artwork (transparent outside the cut shape). */
export function buildCard(fig: HTMLCanvasElement, o: CardOpts): Built {
  const th = THEMES.find((t) => t.id === o.theme) ?? THEMES[0];
  const r = Math.max(0, Math.round((o.border / 100) * fig.height)), H0 = halo(fig, r), FW = H0.c.width, FH = H0.c.height;
  const fl = mk(FW, FH), fg = fl.getContext("2d")!; fg.drawImage(H0.c, 0, 0); fg.drawImage(fig, H0.pad, H0.pad);
  let hole: Built["hole"] = null, crease: Built["crease"] = null;

  if (o.mode === "sticker" && !o.badge) return { art: fl, hole, crease };


  if (o.mode === "book") {
    // three panels: the left half of the figure, the long middle panel (the inside, in the chosen design) and the right half.
    // With the middle as wide as the figure, the halves meet when folded and the card closes into the full picture.
    const half = Math.round(FW / 2), mw = Math.round(FW * Math.max(1, Math.min(2, o.midW || 1))), W = half + mw + (FW - half), py = Math.round(FH * 0.06), ph = FH - py, art = mk(W, FH), g = art.getContext("2d")!;
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(half - 1, py, mw + 2, ph, Math.max(16, r * 1.4)); g.fill();
    const m = Math.max(4, Math.round(r * 0.35)), ix = half + m, iy = py + m, iw = mw - 2 * m, ih = ph - 2 * m;
    drawMiddle(g, ix, iy, iw, ih, o, th, Math.max(12, r * 1.1));
    const lf = mk(half + 1, FH); lf.getContext("2d")!.drawImage(fl, 0, 0, half + 1, FH, 0, 0, half + 1, FH);
    const rt = mk(FW - half + 1, FH); rt.getContext("2d")!.drawImage(fl, half - 1, 0, FW - half + 1, FH, 0, 0, FW - half + 1, FH);
    g.save(); g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = Math.max(4, r * 0.5); g.drawImage(lf, 0, 0); g.drawImage(rt, half + mw - 1, 0); g.restore(); g.drawImage(lf, 0, 0); g.drawImage(rt, half + mw - 1, 0);
    return { art, hole, crease: { x: half, y0: py, y1: FH, x2: half + mw }, safe: { x: ix + FW * 0.03, y: iy + FH * 0.03, w: iw - FW * 0.06, h: ih - FH * 0.06 }, closed: fl };
  }

  if (o.mode === "band") {
    // a band in the brand colour wrapped across the middle of the product, cut to the same shape, with a checkered edge
    const art = mk(FW, FH), g = art.getContext("2d")!; g.drawImage(fl, 0, 0);
    const vertical = FW > FH * 1.15, hd = H0.c.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, FW, FH).data, on = (x: number, y: number) => hd[(y * FW + x) * 4 + 3] > 128;
    const bx = vertical ? Math.round(FW * 0.3) : 0, by = vertical ? 0 : Math.round(FH * 0.26), bw = vertical ? Math.round(FW * 0.44) : FW, bh = vertical ? FH : Math.round(FH * 0.5);
    const band = mk(FW, FH), bg = band.getContext("2d")!;
    bg.fillStyle = th.bg; bg.fillRect(bx, by, bw, bh);
    const cs = Math.max(8, Math.round((vertical ? bw : bh) * 0.045));
    for (let i = 0; i < 2; i++) for (let j = 0; j * cs < (vertical ? bh : bw); j++) { bg.fillStyle = (i + j) % 2 ? th.fg : th.bg; if (vertical) bg.fillRect(bx + bw - cs * (2 - i), by + j * cs, cs, cs); else bg.fillRect(bx + j * cs, by + bh - cs * (2 - i), cs, cs); }
    bg.fillStyle = th.fg; if (vertical) bg.fillRect(bx + bw - cs * 2 - cs * 0.35, by, cs * 0.18, bh); else bg.fillRect(bx, by + bh - cs * 2 - cs * 0.35, bw, cs * 0.18);
    bg.globalCompositeOperation = "destination-in"; bg.drawImage(H0.c, 0, 0);
    g.save(); g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = Math.max(4, cs * 0.6); g.drawImage(band, 0, 0); g.restore(); g.drawImage(band, 0, 0);
    // the usable area: where the shape is solid across the whole band
    let x0 = bx, x1 = bx + bw, y0 = by, y1 = by + bh;
    if (!vertical) { x0 = 0; x1 = FW; for (let y = by; y < by + bh - cs * 2.5; y += 3) { let l = 0, rr = FW - 1; while (l < FW && !on(l, y)) l++; while (rr > 0 && !on(rr, y)) rr--; x0 = Math.max(x0, l); x1 = Math.min(x1, rr); } y1 = by + bh - cs * 2.6; }
    else { y0 = 0; y1 = FH; for (let x = bx; x < bx + bw - cs * 2.5; x += 3) { let t = 0, b = FH - 1; while (t < FH && !on(x, t)) t++; while (b > 0 && !on(x, b)) b--; y0 = Math.max(y0, t); y1 = Math.min(y1, b); } x1 = bx + bw - cs * 2.6; }
    const pad = Math.min(x1 - x0, y1 - y0) * 0.07, cx0 = x0 + pad, cy0 = y0 + pad, cw = x1 - x0 - 2 * pad, ch = y1 - y0 - 2 * pad;
    const tc = mk(FW, FH), t = tc.getContext("2d")!; t.textBaseline = "alphabetic"; let used = 0;
    const igDot = (x: number, y: number, s2: number) => { t.save(); t.strokeStyle = th.fg; t.lineWidth = s2 * 0.12; t.beginPath(); t.roundRect(x, y, s2, s2, s2 * 0.3); t.stroke(); t.beginPath(); t.arc(x + s2 / 2, y + s2 / 2, s2 * 0.22, 0, 7); t.stroke(); t.restore(); };
    const name = (o.shop || "").trim(), social = (o.handle || "").trim().replace(/^@?/, "@"), lines: string[] = [o.address.trim(), o.phone.trim()].filter(Boolean);
    const fit = (txt: string, max: number, w: number, weight: number) => { let fs = max; t.font = FONT(weight, fs); while (t.measureText(txt).width > w && fs > 9) { fs -= 1; t.font = FONT(weight, fs); } return fs; };
    if (cw >= ch * 1.25) {
      // wide band: words on the left, QR on the right
      const qs = Math.min(ch * 0.8, cw * 0.36), qx = cx0 + cw - qs, qy = cy0 + (ch - qs) / 2 + ch * 0.05, lw = cw - qs - cw * 0.06;
      t.textAlign = "left"; t.fillStyle = th.fg; let ty = cy0;
      if (o.logo) { const lh = ch * 0.38, k = Math.min(lw / o.logo.w, lh / o.logo.h); t.drawImage(o.logo.src, cx0, ty, o.logo.w * k, o.logo.h * k); ty += o.logo.h * k + ch * 0.06; }
      else if (name) { const fs = fit(name, ch * 0.3, lw, 900); t.font = FONT(900, fs); t.fillText(name, cx0, ty + fs * 0.88); ty += fs * 1.12; }
      if (o.sub.trim()) { const fs = fit(o.sub.trim(), ch * 0.1, lw, 800); t.font = FONT(800, fs); t.fillStyle = th.accent; t.fillText(o.sub.trim(), cx0, ty + fs); ty += fs * 1.45; t.fillStyle = th.fg; }
      for (const l of lines) { const fs = fit(l.toUpperCase(), ch * 0.085, lw, 700); t.font = FONT(700, fs); t.fillText(l.toUpperCase(), cx0, ty + fs); ty += fs * 1.35; }
      if (o.handle.trim()) { const fs = fit(social, ch * 0.085, lw - ch * 0.12, 700); igDot(cx0, ty + fs * 0.1, fs * 1.05); t.font = FONT(700, fs); t.fillText(social, cx0 + fs * 1.5, ty + fs); ty += fs * 1.35; }
      qrCard(g, o.qr, qx, qy, qs, th.fg);
      t.textAlign = "center"; const ls = fit((o.cta || "SCAN ME").toUpperCase(), ch * 0.1, qs, 900); t.font = FONT(900, ls); t.fillStyle = th.fg; t.fillText((o.cta || "SCAN ME").toUpperCase(), qx + qs / 2, qy - ls * 0.35);
    } else {
      // tall band: everything stacked
      t.textAlign = "center"; t.fillStyle = th.fg; const mid = cx0 + cw / 2; let ty = cy0;
      if (o.logo) { const lh = ch * 0.16, k = Math.min(cw / o.logo.w, lh / o.logo.h); t.drawImage(o.logo.src, mid - (o.logo.w * k) / 2, ty, o.logo.w * k, o.logo.h * k); ty += o.logo.h * k + ch * 0.025; }
      else if (name) { const fs = fit(name, cw * 0.15, cw, 900); t.font = FONT(900, fs); t.fillText(name, mid, ty + fs * 0.88); ty += fs * 1.15; }
      if (o.sub.trim()) { const fs = fit(o.sub.trim(), cw * 0.062, cw, 800); t.font = FONT(800, fs); t.fillStyle = th.accent; t.fillText(o.sub.trim(), mid, ty + fs); ty += fs * 1.5; t.fillStyle = th.fg; }
      const ls = fit((o.cta || "SCAN ME").toUpperCase(), cw * 0.07, cw, 900); t.font = FONT(900, ls); t.fillText((o.cta || "SCAN ME").toUpperCase(), mid, ty + ls); ty += ls * 1.3;
      const rest = (lines.length + (o.handle.trim() ? 1 : 0)) * cw * 0.055 * 1.4, qs = Math.max(Math.min(cw * 0.62, cy0 + ch - ty - rest - ch * 0.03), Math.min(cw * 0.45, ch * 0.4));
      qrCard(g, o.qr, mid - qs / 2, ty, qs, th.fg); ty += qs + ch * 0.03;
      for (const l of lines) { const fs = fit(l.toUpperCase(), cw * 0.055, cw, 700); t.font = FONT(700, fs); t.fillText(l.toUpperCase(), mid, ty + fs); ty += fs * 1.4; }
      if (o.handle.trim()) { const fs = fit(social, cw * 0.055, cw * 0.85, 700); t.font = FONT(700, fs); const tw = t.measureText(social).width; igDot(mid - tw / 2 - fs * 1.4, ty + fs * 0.08, fs * 1.05); t.fillText(social, mid + fs * 0.25, ty + fs); ty += fs * 1.3; }
      used = ty - cy0;
    }
    g.drawImage(tc, 0, Math.max(0, (ch - used) / 2));
    return { art, hole, crease };
  }

  if (o.mode === "fold") {
    const pw = Math.round(FH * 1.2), ph = Math.round(FH * 0.62), ov = Math.round(Math.min(FW * 0.22, pw * 0.2)), py = Math.round(FH * 0.2);
    const W = FW + pw - ov, art = mk(W, FH), g = art.getContext("2d")!;
    const px = o.flip ? 0 : FW - ov, figX = o.flip ? pw - ov : 0;
    // panel: white card with the same border as the figure, then its content
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(px, py, pw, ph, Math.max(18, r * 1.6)); g.fill();
    const ix = px + r + (o.flip ? 0 : ov), iy = py + r, iw = pw - 2 * r - ov, ih = ph - 2 * r;
    const qs = Math.min(ih * 0.76, iw * 0.46);
    g.fillStyle = th.bg; g.beginPath(); g.roundRect(ix, iy, iw, ih, Math.max(12, ih * 0.06)); g.fill();
    // left: words, right: QR card with a SCAN ME tag
    const tx = ix + iw * 0.05, tw = iw - qs - iw * 0.15;
    g.fillStyle = th.fg; g.textAlign = "left"; g.textBaseline = "alphabetic";
    let ty = iy + ih * 0.2, fs = Math.min(ih * 0.17, 90); g.font = FONT(900, fs);
    let lines = wrap(g, (o.shop || "").trim() || " ", tw); while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > tw)) && fs > 18) { fs -= 2; g.font = FONT(900, fs); lines = wrap(g, o.shop.trim(), tw); }
    for (const l of lines) { g.fillText(l, tx, ty); ty += fs * 1.05; }
    if (o.sub.trim()) { let ss = Math.min(ih * 0.085, 44); g.font = FONT(600, ss); g.globalAlpha = 0.92; let sl = wrap(g, o.sub.trim(), tw); while (sl.length > 3 && ss > 14) { ss -= 1; g.font = FONT(600, ss); sl = wrap(g, o.sub.trim(), tw); } ty += ss * 0.35; for (const l of sl) { ty += ss * 1.2; g.fillText(l, tx, ty); } g.globalAlpha = 1; }
    if (o.phone.trim()) { const ps = Math.min(ih * 0.1, 50); g.font = FONT(800, ps); g.fillStyle = th.accent; g.fillText(o.phone.trim().slice(0, 22), tx, iy + ih - ih * 0.1); }
    const qx = ix + iw - qs - iw * 0.05, qy = iy + (ih - qs) / 2 + ih * 0.04;
    qrCard(g, o.qr, qx, qy, qs, th.accent);
    pill(g, (o.cta || "SCAN ME").slice(0, 14), qx + qs / 2, qy - qs * 0.02, Math.max(30, qs * 0.17), th.accent, th.bg);
    // the figure goes on top, so the panel looks like it folds out from behind it
    g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = Math.max(6, r * 0.8); g.shadowOffsetX = o.flip ? 4 : -4; g.drawImage(fl, figX, 0); g.shadowColor = "transparent"; g.drawImage(fl, figX, 0);
    crease = { x: o.flip ? pw - ov : FW - ov + 2, y0: py, y1: py + ph };
    if (o.flip) crease.x = pw - ov;
    return { art, hole, crease };
  }

  // hanger (ring on top, QR on the picture) or sticker with a QR badge
  const R = Math.round(FH * 0.075), top = o.mode === "hanger" ? Math.round(R * 1.55) : 0, art = mk(FW, FH + top), g = art.getContext("2d")!;
  g.drawImage(fl, 0, top);
  const s = Math.round(Math.min(FW, FH) * (o.mode === "hanger" ? 0.4 : 0.3)), cx = o.mode === "hanger" ? FW / 2 : FW - s * 0.62, qy = top + FH - s - (o.mode === "hanger" ? FH * 0.14 : FH * 0.04);
  if (o.mode === "hanger") {
    // ring over the highest part of the picture
    const d = H0.c.getContext("2d")!.getImageData(0, 0, FW, FH).data; let ry = 0; for (; ry < FH; ry++) { let any = false; for (let x = 0; x < FW; x += 2) if (d[(ry * FW + x) * 4 + 3] > 128) { any = true; break; } if (any) break; }
    let sx = 0, n = 0; for (let y = ry; y < Math.min(FH, ry + 8); y++) for (let x = 0; x < FW; x++) if (d[(y * FW + x) * 4 + 3] > 128) { sx += x; n++; }
    const rx = Math.max(R, Math.min(FW - R, n ? sx / n : FW / 2)), ringY = top + ry - R * 0.55 + (R * 0.1);
    const cy = Math.max(R, ringY);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(rx, cy, R, 0, 7); g.fill();
    hole = { x: rx, y: cy, r: R * 0.5 };
    g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.beginPath(); g.arc(rx, cy, hole.r, 0, 7); g.fill(); g.fillRect(rx - R * 0.14, cy - R - 2, R * 0.28, R + 2 - 0); g.restore();
  }
  qrCard(g, o.qr, cx - s / 2, qy, s, th.bg);
  pill(g, (o.cta || "SCAN ME").slice(0, 14), cx, qy - s * 0.01, Math.max(28, s * 0.18), th.bg, th.fg);
  if (o.mode === "hanger" && o.phone.trim()) { g.font = FONT(800, s * 0.12); const t = o.phone.trim().slice(0, 22), tw = g.measureText(t).width + s * 0.2; g.fillStyle = "#fff"; g.beginPath(); g.roundRect(cx - tw / 2, qy + s + s * 0.04, tw, s * 0.2, s * 0.07); g.fill(); g.fillStyle = th.bg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, cx, qy + s + s * 0.14); }
  return { art, hole, crease };
}

/** The outline of the finished shape (the cut line), as a polygon in artwork pixels. */
export function contourOf(art: HTMLCanvasElement, res = 700): [number, number][] {
  const m = Math.min(1, res / Math.max(art.width, art.height)), w = Math.max(2, Math.round(art.width * m)), h = Math.max(2, Math.round(art.height * m));
  const pad = 2, W = w + pad * 2, Hh = h + pad * 2, s = mk(W, Hh), sg = s.getContext("2d", { willReadFrequently: true })!; sg.drawImage(art, pad, pad, w, h);
  const d = sg.getImageData(0, 0, W, Hh).data, on = new Uint8Array(W * Hh); for (let i = 0; i < on.length; i++) on[i] = d[i * 4 + 3] > 128 ? 1 : 0;
  // largest connected piece
  const lab = new Int32Array(W * Hh); let best = 0, bestN = 0, cur = 0;
  for (let i = 0; i < on.length; i++) if (on[i] && !lab[i]) { cur++; let n = 0; const st = [i]; lab[i] = cur; while (st.length) { const p = st.pop()!; n++; const x = p % W, y = (p / W) | 0; for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < Hh - 1 ? p + W : -1]) if (q >= 0 && on[q] && !lab[q]) { lab[q] = cur; st.push(q); } } if (n > bestN) { bestN = n; best = cur; } }
  const inC = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < Hh && lab[y * W + x] === best;
  // directed edges around the piece, chained into loops; the loop with the biggest area is the outside
  const next = new Map<number, number[]>(); const key = (x: number, y: number) => y * (W + 1) + x;
  const add = (x0: number, y0: number, x1: number, y1: number) => { const k = key(x0, y0); (next.get(k) ?? next.set(k, []).get(k)!).push(key(x1, y1)); };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (inC(x, y)) {
    if (!inC(x, y - 1)) add(x, y, x + 1, y); if (!inC(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!inC(x, y + 1)) add(x + 1, y + 1, x, y + 1); if (!inC(x - 1, y)) add(x, y + 1, x, y);
  }
  const loops: number[][] = [];
  for (const [k0] of next) { while ((next.get(k0)?.length ?? 0) > 0) { const lp = [k0]; let k = k0; for (;;) { const a = next.get(k); if (!a || !a.length) break; const nx = a.pop()!; if (nx === k0) break; lp.push(nx); k = nx; } loops.push(lp); } }
  let outer: number[] = [], bestA = 0;
  for (const lp of loops) { let a = 0; for (let i = 0; i < lp.length; i++) { const p = lp[i], q = lp[(i + 1) % lp.length]; const px = p % (W + 1), py = (p / (W + 1)) | 0, qx = q % (W + 1), qy = (q / (W + 1)) | 0; a += px * qy - qx * py; } if (Math.abs(a) > bestA) { bestA = Math.abs(a); outer = lp; } }
  let pts: [number, number][] = outer.map((p) => [p % (W + 1), (p / (W + 1)) | 0]);
  // smooth the pixel staircase (moving average), then drop points that do not matter
  const n = pts.length, win = 5, sm: [number, number][] = [];
  for (let i = 0; i < n; i++) { let sx = 0, sy = 0; for (let j = -win; j <= win; j++) { const p = pts[(i + j + n) % n]; sx += p[0]; sy += p[1]; } sm.push([sx / (2 * win + 1), sy / (2 * win + 1)]); }
  pts = rdp(sm, 0.45);
  return pts.map(([x, y]) => [(x - pad) / m, (y - pad) / m] as [number, number]);
}
function rdp(p: [number, number][], eps: number): [number, number][] {
  if (p.length < 4) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st: [number, number][] = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop()!; let md = 0, mi = -1; const [x1, y1] = p[a], [x2, y2] = p[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * p[i][0] - dx * p[i][1] + x2 * y1 - y2 * x1) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return p.filter((_, i) => keep[i]);
}


/** A smooth closed path through the cut-line points (curves through the midpoints), scaled by k. */
function smoothPath(poly: [number, number][], k: number, hole: Built["hole"]): Path2D {
  const p = new Path2D(), n = poly.length; if (n < 3) return p;
  const mid = (a: [number, number], b: [number, number]) => [((a[0] + b[0]) / 2) * k, ((a[1] + b[1]) / 2) * k];
  const s0 = mid(poly[n - 1], poly[0]); p.moveTo(s0[0], s0[1]);
  for (let i = 0; i < n; i++) { const c = poly[i], m = mid(c, poly[(i + 1) % n]); p.quadraticCurveTo(c[0] * k, c[1] * k, m[0], m[1]); }
  p.closePath();
  if (hole) { p.moveTo((hole.x + hole.r) * k, hole.y * k); p.arc(hole.x * k, hole.y * k, hole.r * k, 0, Math.PI * 2, true); p.closePath(); }
  return p;
}

/** The print-quality result: built from the full-size picture, with edges cut by a smooth vector path (no jagged pixels). */
export function renderFinal(fig: HTMLCanvasElement, o: CardOpts, pxWidth: number) {
  const built = buildCard(fig, o), poly = contourOf(built.art, 1600), a = built.art, k = pxWidth / a.width;
  const c = mk(pxWidth, a.height * k), g = c.getContext("2d")!, path = smoothPath(poly, k, built.hole);
  g.fillStyle = "#fff"; g.fill(path, "evenodd");
  g.save(); g.clip(path, "evenodd"); g.imageSmoothingQuality = "high"; g.drawImage(a, 0, 0, c.width, c.height); g.restore();
  return { canvas: c, poly, built };
}

/** Cut line as an SVG path in millimetres. */
export function cutSvg(poly: [number, number][], hole: Built["hole"], wPx: number, hPx: number, wMm: number, hMm: number): string {
  const k = wMm / wPx, f = (v: number) => (v * k).toFixed(2);
  const d = "M" + poly.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L") + " Z";
  const c = hole ? `<circle cx="${f(hole.x)}" cy="${f(hole.y)}" r="${f(hole.r)}" fill="none" stroke="#ff00ff" stroke-width="0.25"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wMm.toFixed(1)}mm" height="${hMm.toFixed(1)}mm" viewBox="0 0 ${wMm.toFixed(2)} ${hMm.toFixed(2)}"><title>CutContour</title><g id="CutContour"><path d="${d}" fill="none" stroke="#ff00ff" stroke-width="0.25"/>${c}</g></svg>`;
}

/** How many copies fit on a sheet (best of portrait and landscape). */
export function sheetFit(wMm: number, hMm: number, sheet: "A4" | "A3") {
  const [pw0, ph0] = sheet === "A4" ? [210, 297] : [297, 420], M = 10, G = 6;
  const fit = (pw: number, ph: number) => ({ pw, ph, cols: Math.max(0, Math.floor((pw - 2 * M + G) / (wMm + G))), rows: Math.max(0, Math.floor((ph - 2 * M + G) / (hMm + G))) });
  const a = fit(pw0, ph0), b = fit(ph0, pw0), best = a.cols * a.rows >= b.cols * b.rows ? a : b;
  return { ...best, M, G, per: best.cols * best.rows };
}

/** One PDF page with copies of the artwork and the cut line on top.
 *  "machine": the cut line is a spot colour called CutContour (what print-and-cut machines look for).
 *  "scissors": a visible dashed line. */
export async function sheetPdf(art: HTMLCanvasElement, poly: [number, number][], hole: Built["hole"], wMm: number, hMm: number, sheet: "A4" | "A3", cut: "machine" | "scissors", pngBytes: Uint8Array, note: string): Promise<Uint8Array> {
  const { PDFDocument, PDFName, PDFNumber, PDFOperator, PDFOperatorNames: Op, StandardFonts, rgb } = await import("pdf-lib");
  const L = sheetFit(wMm, hMm, sheet), MM = 72 / 25.4, pdf = await PDFDocument.create(), page = pdf.addPage([L.pw * MM, L.ph * MM]);
  const img = await pdf.embedPng(pngBytes);
  const ctx = pdf.context;
  if (cut === "machine") {
    const fn = ctx.register(ctx.obj({ FunctionType: 2, Domain: [0, 1], C0: [0, 0, 0, 0], C1: [0, 1, 0, 0], N: 1 }));
    const cs = ctx.register(ctx.obj([PDFName.of("Separation"), PDFName.of("CutContour"), PDFName.of("DeviceCMYK"), fn]));
    page.node.Resources()!.set(PDFName.of("ColorSpace"), ctx.obj({ CS0: cs }));
  }
  const totalW = L.cols * wMm + (L.cols - 1) * L.G, totalH = L.rows * hMm + (L.rows - 1) * L.G, x0 = (L.pw - totalW) / 2, y0 = (L.ph - totalH) / 2, k = wMm / art.width;
  const num = (v: number) => PDFNumber.of(+v.toFixed(3));
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
    const ox = x0 + c * (wMm + L.G), oy = y0 + r * (hMm + L.G);
    page.drawImage(img, { x: ox * MM, y: (L.ph - oy - hMm) * MM, width: wMm * MM, height: hMm * MM });
    const P = (x: number, y: number): [number, number] => [(ox + x * k) * MM, (L.ph - (oy + y * k)) * MM];
    const ops = [PDFOperator.of(Op.PushGraphicsState, [])];
    if (cut === "machine") ops.push(PDFOperator.of(Op.StrokingColorspace, [PDFName.of("CS0")]), PDFOperator.of(Op.StrokingColorN, [num(1)]), PDFOperator.of(Op.SetLineWidth, [num(0.25)]));
    else ops.push(PDFOperator.of(Op.StrokingColorRgb, [num(0.15), num(0.15), num(0.15)]), PDFOperator.of(Op.SetLineWidth, [num(0.8)]), PDFOperator.of(Op.SetLineDashPattern, [ctx.obj([4, 3]), num(0)]));
    const path = (pts: [number, number][]) => { pts.forEach(([x, y], i) => { const [px, py] = P(x, y); ops.push(PDFOperator.of(i ? Op.LineTo : Op.MoveTo, [num(px), num(py)])); }); ops.push(PDFOperator.of(Op.ClosePath, []), PDFOperator.of(Op.StrokePath, [])); };
    path(poly);
    if (hole) path(Array.from({ length: 48 }, (_, i) => [hole.x + Math.cos((i / 48) * 6.2832) * hole.r, hole.y + Math.sin((i / 48) * 6.2832) * hole.r] as [number, number]));
    ops.push(PDFOperator.of(Op.PopGraphicsState, [])); page.pushOperators(...ops);
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(note, { x: 12, y: 8, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  return pdf.save({ useObjectStreams: false });
}

/** A friendly cartoon coffee cup, so people can try the tool without a picture of their own. */
export function sampleFigure(): HTMLCanvasElement {
  const c = mk(700, 900), g = c.getContext("2d")!;
  g.lineJoin = "round"; g.lineCap = "round";
  g.fillStyle = "#fff7ed"; g.strokeStyle = "#1c1917"; g.lineWidth = 12;
  g.beginPath(); g.moveTo(140, 330); g.lineTo(560, 330); g.lineTo(520, 760); g.quadraticCurveTo(515, 830, 450, 830); g.lineTo(250, 830); g.quadraticCurveTo(185, 830, 180, 760); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(560, 420); g.bezierCurveTo(700, 400, 700, 640, 535, 650); g.lineWidth = 34; g.strokeStyle = "#1c1917"; g.stroke(); g.lineWidth = 16; g.strokeStyle = "#fff7ed"; g.stroke();
  g.lineWidth = 12; g.strokeStyle = "#1c1917";
  g.fillStyle = "#ff5a1f"; g.beginPath(); g.moveTo(150, 360); g.lineTo(550, 360); g.lineTo(530, 480); g.lineTo(168, 480); g.closePath(); g.fill();
  g.fillStyle = "#fff"; g.font = FONT(900, 60); g.textAlign = "center"; g.fillText("HELLO", 350, 440);
  g.fillStyle = "#1c1917"; g.beginPath(); g.arc(290, 600, 20, 0, 7); g.arc(420, 600, 20, 0, 7); g.fill();
  g.lineWidth = 12; g.beginPath(); g.arc(355, 640, 52, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = "#fda4af"; g.beginPath(); g.ellipse(235, 650, 26, 16, 0, 0, 7); g.ellipse(475, 650, 26, 16, 0, 0, 7); g.fill();
  g.strokeStyle = "#1c1917"; g.lineWidth = 12; g.fillStyle = "#fff"; g.beginPath(); g.roundRect(120, 290, 460, 54, 24); g.fill(); g.stroke();
  g.strokeStyle = "#94a3b8"; g.lineWidth = 14; for (const x of [260, 350, 440]) { g.beginPath(); g.moveTo(x, 250); g.bezierCurveTo(x - 40, 190, x + 40, 130, x, 60); g.stroke(); }
  return c;
}
