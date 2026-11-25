// Door hanger maker: a printable card that hangs on a door handle, with an offer and a QR code.
// Everything is drawn on a canvas in the browser. The same drawing is used for the preview, the print-quality PNG and the PDF sheet.
import QRCode from "qrcode";

export type HShape = "classic" | "tag" | "arch" | "tshirt" | "sneaker" | "bag" | "house";
export interface HTheme { id: string; name: string; bg: string; fg: string; accent: string }
export const THEMES: HTheme[] = [
  { id: "orange", name: "Orange", bg: "#ff5a1f", fg: "#0a0a0a", accent: "#ffffff" },
  { id: "night", name: "Night", bg: "#0f0f12", fg: "#f4f4f5", accent: "#ff7a45" },
  { id: "green", name: "Fresh", bg: "#0f7a4a", fg: "#f0fdf4", accent: "#fde047" },
  { id: "blue", name: "Royal", bg: "#1d3fbf", fg: "#eef2ff", accent: "#fbbf24" },
  { id: "rose", name: "Rose", bg: "#e11d48", fg: "#fff1f2", accent: "#ffffff" },
  { id: "sun", name: "Sunshine", bg: "#facc15", fg: "#1c1917", accent: "#b91c1c" },
  { id: "cream", name: "Cream", bg: "#f3ede2", fg: "#1c1917", accent: "#c2410c" },
  { id: "plum", name: "Plum", bg: "#4c1d95", fg: "#f5f3ff", accent: "#fb923c" },
];

/** Real-world size of each shape (mm). The drawing keeps the same proportions. */
export const SHAPES: Record<HShape, { label: string; hint: string; mm: [number, number] }> = {
  classic: { label: "Door hanger", hint: "Hole and slot for a handle", mm: [85, 190] },
  arch: { label: "Arch", hint: "Rounded top, hole and slot", mm: [85, 190] },
  tag: { label: "Small tag", hint: "Hole for a string", mm: [70, 120] },
  tshirt: { label: "T-shirt", hint: "Die-cut, ring with a slot", mm: [130, 161] },
  sneaker: { label: "Sneaker", hint: "Die-cut, ring with a slot", mm: [130, 118] },
  bag: { label: "Shopping bag", hint: "Die-cut, ring with a slot", mm: [90, 111] },
  house: { label: "House", hint: "Die-cut, ring with a slot", mm: [100, 124] },
};
export const FANCY_SHAPES: HShape[] = ["tshirt", "sneaker", "bag", "house"];
export const DW = 420;                                   // design width in drawing units
export const dh = (s: HShape) => FANCY[s]?.H ?? Math.round((DW * SHAPES[s].mm[1]) / SHAPES[s].mm[0]);


// ---- die-cut shapes: a silhouette (SVG path in design units) plus a hanging ring and ready-made slots for the words and the QR code
interface Slot { shop?: { x: number; w: number; y: number; size: number }; head?: { x: number; y: number; w: number; h: number; max: number }; card: { x: number; y: number; s: number }; cta?: { cx: number; y: number; w: number; h: number } }
interface Fancy { H: number; path: string; ring: { cx: number; cy: number; R: number; r: number }; slot: Slot; deco?: (g: CanvasRenderingContext2D, fg: string) => void }
export const FANCY: Partial<Record<HShape, Fancy>> = {
  tshirt: { H: 520, path: "M150 130 L270 130 L350 160 L410 250 L350 300 L320 270 L320 500 Q320 510 310 510 L110 510 Q100 510 100 500 L100 270 L70 300 L10 250 L70 160 Z", ring: { cx: 210, cy: 78, R: 54, r: 27 },
    slot: { shop: { x: 112, w: 196, y: 224, size: 15 }, head: { x: 112, y: 238, w: 196, h: 62, max: 56 }, card: { x: 130, y: 306, s: 160 }, cta: { cx: 210, y: 474, w: 190, h: 30 } },
    deco: (g, fg) => { g.strokeStyle = fg; g.globalAlpha = 0.3; g.lineWidth = 7; g.beginPath(); g.ellipse(210, 134, 54, 24, 0, 0, Math.PI); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(100, 276); g.lineTo(70, 306); g.moveTo(320, 276); g.lineTo(350, 306); g.stroke(); g.globalAlpha = 1; } },
  sneaker: { H: 380, path: "M50 70 L150 60 Q180 120 235 150 L310 185 Q405 215 408 290 L408 340 Q408 358 390 358 L40 358 Q18 358 18 336 L18 150 Q20 82 50 70 Z", ring: { cx: 100, cy: 48, R: 46, r: 23 },
    slot: { head: { x: 32, y: 108, w: 146, h: 108, max: 52 }, shop: { x: 30, w: 150, y: 246, size: 13 }, card: { x: 214, y: 204, s: 110 }, cta: { cx: 105, y: 262, w: 142, h: 34 } },
    deco: (g, fg) => { g.fillStyle = "rgba(255,255,255,.88)"; g.fillRect(0, 322, 420, 40); g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(0, 316, 420, 6); g.strokeStyle = fg; g.globalAlpha = 0.55; g.lineWidth = 6; g.lineCap = "round"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(180 + i * 18, 118 + i * 11); g.lineTo(208 + i * 18, 106 + i * 11); g.stroke(); } g.globalAlpha = 1; } },
  bag: { H: 520, path: "M30 132 L390 132 L404 498 Q404 512 390 512 L30 512 Q16 512 16 498 Z", ring: { cx: 210, cy: 78, R: 54, r: 27 },
    slot: { shop: { x: 40, w: 340, y: 170, size: 19 }, head: { x: 40, y: 182, w: 340, h: 88, max: 78 }, card: { x: 110, y: 276, s: 200 }, cta: { cx: 210, y: 474, w: 300, h: 34 } },
    deco: (g, fg) => { g.strokeStyle = fg; g.globalAlpha = 0.25; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 144); g.lineTo(390, 144); g.stroke(); g.globalAlpha = 1; } },
  house: { H: 520, path: "M210 108 L402 244 L402 498 Q402 512 388 512 L32 512 Q18 512 18 498 L18 244 Z", ring: { cx: 210, cy: 62, R: 52, r: 26 },
    slot: { head: { x: 98, y: 190, w: 224, h: 52, max: 44 }, shop: { x: 40, w: 340, y: 270, size: 17 }, card: { x: 116, y: 282, s: 188 }, cta: { cx: 210, y: 474, w: 300, h: 32 } },
    deco: (g, fg) => { g.strokeStyle = fg; g.globalAlpha = 0.28; g.lineWidth = 6; g.lineJoin = "round"; g.beginPath(); g.moveTo(18, 244); g.lineTo(210, 108); g.lineTo(402, 244); g.stroke(); g.globalAlpha = 1; } },
};

function drawFancy(canvas: HTMLCanvasElement, d: HangerData, px: number, guides: boolean) {
  const F = FANCY[d.shape]!, W = DW, H = F.H, s = px / W, th = THEMES.find((t) => t.id === d.theme) ?? THEMES[0];
  canvas.width = Math.round(px); canvas.height = Math.round(H * s);
  const g = canvas.getContext("2d")!; g.clearRect(0, 0, canvas.width, canvas.height); g.save(); g.scale(s, s);
  const body = new Path2D(F.path), { cx, cy, R, r } = F.ring;
  g.fillStyle = th.bg; g.strokeStyle = th.bg; g.lineWidth = 12; g.lineJoin = "round";
  g.fill(body); g.stroke(body); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.save(); g.clip(body); g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.arc(W * 0.9, H * 0.35, 170, 0, 7); g.fill(); g.restore();
  g.save(); g.clip(body); F.deco?.(g, th.fg); g.restore();
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  const sl = F.slot;
  if (sl.shop && d.shop.trim()) {
    g.fillStyle = th.fg; (g as unknown as { letterSpacing: string }).letterSpacing = "2px";
    let txt = d.shop.toUpperCase().slice(0, 40), sz = sl.shop.size; g.font = FONT(800, sz);
    while (g.measureText(txt).width > sl.shop.w && sz > 9) { sz--; g.font = FONT(800, sz); }
    while (g.measureText(txt).width > sl.shop.w && txt.length > 4) txt = txt.slice(0, -2);
    g.fillText(txt, sl.shop.x + sl.shop.w / 2 + 1, sl.shop.y); (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }
  if (sl.head) {
    const h = sl.head; g.fillStyle = th.accent; let size = h.max, lines: string[] = [];
    for (; size >= 20; size -= 2) { g.font = FONT(900, size); lines = wrap(g, d.headline.trim() || " ", h.w); if (lines.length * size * 1.0 <= h.h && lines.every((l) => g.measureText(l).width <= h.w)) break; }
    g.font = FONT(900, size); const total = lines.length * size, top = h.y + (h.h - total) / 2;
    lines.forEach((l, i) => g.fillText(l, h.x + h.w / 2, top + size * 0.82 + i * size));
  }
  // QR card
  const c = sl.card, pad = c.s * 0.07;
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(c.x, c.y, c.s, c.s, c.s * 0.12); g.fill();
  const mx = matrix(d.qr || SAMPLE_LINK), n = mx.size, ms = (c.s - 2 * pad) / (n + 2);
  g.fillStyle = "#0a0a0a"; const qx = c.x + pad + ms, qy = c.y + pad + ms;
  for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) if (mx.get(rr, cc)) g.fillRect(qx + cc * ms - 0.2, qy + rr * ms - 0.2, ms + 0.4, ms + 0.4);
  if (sl.cta && d.cta.trim()) {
    const q = sl.cta; let sz = 22, txt = d.cta.trim().slice(0, 30); g.font = FONT(800, sz);
    while (g.measureText(txt).width + 36 > q.w && sz > 11) { sz--; g.font = FONT(800, sz); }
    const tw = Math.min(q.w, g.measureText(txt).width + 36);
    g.fillStyle = th.fg; g.beginPath(); g.roundRect(q.cx - tw / 2, q.y, tw, q.h, q.h / 2); g.fill();
    g.fillStyle = th.bg; g.fillText(txt, q.cx, q.y + q.h / 2 + sz * 0.35);
  }
  // ring hole and the slot up to the top of the ring
  g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.fillRect(cx - 7, cy - R - 4, 14, R + 4 - 0); g.restore();
  if (guides) {
    g.save(); g.strokeStyle = "rgba(60,60,60,.9)"; g.lineWidth = 1.6; g.setLineDash([7, 5]); g.lineJoin = "round";
    g.stroke(body); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(cx - 7, cy - R); g.lineTo(cx - 7, cy - r + 2); g.moveTo(cx + 7, cy - R); g.lineTo(cx + 7, cy - r + 2); g.stroke(); g.restore();
  }
  g.restore();
}

export interface HangerData {
  shape: HShape; theme: string;
  shop: string; headline: string; sub: string; cta: string; foot: string;
  logo: CanvasImageSource | null; logoW?: number; logoH?: number;
  qr: string;
}
export const SAMPLE_LINK = "https://yourshop.in";
export const DEFAULTS: Omit<HangerData, "logo" | "qr"> = {
  shape: "classic", theme: "orange", shop: "Your shop name", headline: "20% OFF", sub: "On your first order this week", cta: "Scan to order", foot: "Valid till 31 Dec",
};

type Matrix = { size: number; get(r: number, c: number): number };
const matrix = (t: string): Matrix => QRCode.create(t || " ", { errorCorrectionLevel: "M" }).modules as unknown as Matrix;

function outline(g: CanvasRenderingContext2D, shape: HShape, W: number, H: number) {
  g.beginPath();
  if (shape === "arch") g.roundRect(0, 0, W, H, [W / 2, W / 2, 30, 30]);
  else g.roundRect(0, 0, W, H, shape === "tag" ? 40 : 30);
}
const holeOf = (shape: HShape, W: number) => shape === "tag" ? { x: W / 2, y: 72, r: 24, slit: false } : shape === "arch" ? { x: W / 2, y: 160, r: 46, slit: true } : { x: W / 2, y: 96, r: 44, slit: true };

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? line + " " + w : w;
      if (g.measureText(t).width <= maxW || !line) line = t; else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out.filter((l, i, a) => l || a.length === 1);
}
const FONT = (w: number, px: number) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

/** Draws the hanger at `px` pixels wide. guides = dashed cut lines for the print sheet. */
export function drawHanger(canvas: HTMLCanvasElement, d: HangerData, px: number, guides = false) {
  if (FANCY[d.shape]) { drawFancy(canvas, d, px, guides); return; }
  const W = DW, H = dh(d.shape), s = px / W, th = THEMES.find((t) => t.id === d.theme) ?? THEMES[0];
  canvas.width = Math.round(px); canvas.height = Math.round(H * s);
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save(); g.scale(s, s);
  // body
  outline(g, d.shape, W, H); g.fillStyle = th.bg; g.fill();
  g.save(); outline(g, d.shape, W, H); g.clip();
  // soft decoration so a flat colour does not look empty
  g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.arc(W * 0.95, H * 0.34, 190, 0, 7); g.fill();
  g.fillStyle = "rgba(0,0,0,.06)"; g.beginPath(); g.arc(-30, H * 0.62, 150, 0, 7); g.fill();
  const hole = holeOf(d.shape, W), small = d.shape === "tag";
  let y = hole.y + hole.r + (small ? 34 : 40);
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  // logo
  if (d.logo) {
    const r = small ? 28 : 36, cx = W / 2, cy = y + r - 8;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.closePath(); g.clip(); g.fillStyle = "#fff"; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    const iw = d.logoW ?? r * 2, ih = d.logoH ?? r * 2, k = Math.min((r * 1.7) / iw, (r * 1.7) / ih);
    g.drawImage(d.logo, cx - (iw * k) / 2, cy - (ih * k) / 2, iw * k, ih * k); g.restore();
    g.lineWidth = 4; g.strokeStyle = th.fg; g.globalAlpha = 0.25; g.beginPath(); g.arc(cx, cy, r + 2, 0, 7); g.stroke(); g.globalAlpha = 1;
    y = cy + r + 30;
  }
  // shop name
  g.fillStyle = th.fg; g.font = FONT(800, small ? 18 : 23);
  const shop = (d.shop || "").toUpperCase().slice(0, 40);
  (g as unknown as { letterSpacing: string }).letterSpacing = "3px";
  const shopLines = wrap(g, shop, W - 70).slice(0, 2);
  for (const l of shopLines) { g.fillText(l, W / 2 + 1.5, y); y += small ? 22 : 27; }
  (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
  y += small ? 8 : 12;
  // QR card (bottom) is placed first so text can use the space above it
  const qs = small ? 220 : 282, pad = 16, footH = d.foot.trim() ? 32 : 4, ctaH = d.cta.trim() ? 60 : 0;
  const cardTop = H - 22 - footH - (ctaH ? ctaH + 16 : 0) - qs - pad * 2 - 8;
  const avail = cardTop - 18 - y;
  // headline: biggest size that fits in up to 3 lines and 66% of the free space
  g.fillStyle = th.accent;
  const hasSub = !!d.sub.trim(), share = hasSub ? 0.72 : 0.95;
  let size = small ? 84 : 130, lines: string[] = [];
  for (; size >= 30; size -= 3) { g.font = FONT(900, size); lines = wrap(g, d.headline.trim() || " ", W - 64); if (lines.length <= 3 && lines.length * size * 1.04 <= avail * share && lines.every((l) => g.measureText(l).width <= W - 56)) break; }
  g.font = FONT(900, size);
  for (const l of lines) { y += size * 0.9; g.fillText(l, W / 2, y); y += size * 0.14; }
  y += 10;
  // sub line (as large as fits in what is left)
  if (hasSub) {
    g.fillStyle = th.fg;
    for (let ss = small ? 22 : 29; ss >= 16; ss -= 2) {
      g.font = FONT(600, ss); const sl = wrap(g, d.sub.trim(), W - 80).slice(0, 3), need = sl.length * ss * 1.35;
      if (need <= cardTop - 14 - y || ss === 16) { let yy = y; for (const l of sl) { yy += ss * 1.15; if (yy > cardTop - 8) break; g.fillText(l, W / 2, yy); yy += ss * 0.2; } break; }
    }
  }
  // QR card
  const cx = (W - qs - pad * 2) / 2;
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(cx, cardTop, qs + pad * 2, qs + pad * 2, 30); g.fill();
  const mx = matrix(d.qr || SAMPLE_LINK), n = mx.size, ms = qs / (n + 2);   // 1 module of quiet zone inside the white card
  g.fillStyle = "#0a0a0a";
  const qx = cx + pad + ms, qy = cardTop + pad + ms;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (mx.get(r, c)) g.fillRect(qx + c * ms - 0.2, qy + r * ms - 0.2, ms + 0.4, ms + 0.4);
  // call to action pill + footer
  let by = cardTop + qs + pad * 2 + 16;
  if (ctaH) {
    g.font = FONT(800, 29); const tw = Math.min(W - 60, g.measureText(d.cta.trim()).width + 70);
    g.fillStyle = th.fg; g.beginPath(); g.roundRect((W - tw) / 2, by, tw, ctaH - 4, 30); g.fill();
    g.fillStyle = th.bg; g.fillText(d.cta.trim().slice(0, 30), W / 2, by + 40); by += ctaH;
  }
  if (d.foot.trim()) { g.fillStyle = th.fg; g.globalAlpha = 0.85; g.font = FONT(600, 21); g.fillText(d.foot.trim().slice(0, 48), W / 2, H - 24); g.globalAlpha = 1; }
  g.restore();
  // cut-outs
  g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
  g.beginPath(); g.arc(hole.x, hole.y, hole.r, 0, 7); g.fill();
  if (hole.slit) g.fillRect(hole.x - 11, 0, 22, hole.y);
  g.restore();
  if (guides) {
    g.save(); g.strokeStyle = "rgba(60,60,60,.9)"; g.lineWidth = 1.6; g.setLineDash([7, 5]);
    outline(g, d.shape, W, H); g.stroke();
    g.beginPath(); g.arc(hole.x, hole.y, hole.r, 0, 7); g.stroke();
    if (hole.slit) { g.beginPath(); g.moveTo(hole.x - 11, 0); g.lineTo(hole.x - 11, hole.y - 4); g.moveTo(hole.x + 11, 0); g.lineTo(hole.x + 11, hole.y - 4); g.stroke(); }
    g.restore();
  }
  g.restore();
}

/** How many hangers fit on one A4 sheet (best of portrait or landscape). */
export function sheetLayout(shape: HShape) {
  const [w, h] = SHAPES[shape].mm, M = 9, G = 7;
  const fit = (pw: number, ph: number) => ({ pw, ph, cols: Math.max(1, Math.floor((pw - 2 * M + G) / (w + G))), rows: Math.max(1, Math.floor((ph - 2 * M + G) / (h + G))) });
  const a = fit(210, 297), b = fit(297, 210);
  const best = a.cols * a.rows >= b.cols * b.rows ? a : b;
  return { ...best, w, h, M, G, per: best.cols * best.rows };
}

/** Plain-language tips under the preview. */
export function hangerAdvice(d: Pick<HangerData, "headline" | "sub" | "qr" | "shop">): string[] {
  const out: string[] = [];
  if (d.headline.trim().length > 22) out.push("A short headline reads from further away. Try five words or fewer.");
  if (d.qr && d.qr.length > 110) out.push("The link is long, so the QR squares are small. A shorter link prints and scans better.");
  if (!d.shop.trim()) out.push("Add your shop name so people know who it is from.");
  return out;
}
