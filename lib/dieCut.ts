// Die-cut card maker: turns a picture with a transparent background into a sticker, a fold-out QR card or a hanger,
// with a white border and a cut line. Everything is drawn on canvases in the browser; nothing is uploaded.
import QRCode from "qrcode";
import { THEMES } from "./doorHanger";

export type CardMode = "book" | "sticker" | "fold" | "hanger";
export interface Pic { src: CanvasImageSource; w: number; h: number }
export interface CardOpts {
  mode: CardMode; border: number;                  // white border as % of the picture height
  theme: string; shop: string; sub: string; phone: string; cta: string;
  qr: string; badge: boolean; flip: boolean;       // badge: QR badge on a plain sticker; flip: panel on the left
  handle: string; logo: Pic | null; shot: Pic | null;   // book card: name on the phone, brand logo, screenshot of the profile
}
export const CARD_DEFAULTS: CardOpts = { mode: "book", border: 3, theme: "green", shop: "Your shop name", sub: "Follow us and order online", phone: "", cta: "SCAN ME", qr: "", badge: false, flip: false, handle: "yourshop", logo: null, shot: null };
export const SAMPLE_QR = "https://yourshop.in";

type Matrix = { size: number; get(r: number, c: number): number };
const matrix = (t: string): Matrix => QRCode.create(t || " ", { errorCorrectionLevel: "M" }).modules as unknown as Matrix;
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

function qrCard(g: CanvasRenderingContext2D, text: string, x: number, y: number, s: number, accent: string) {
  g.save(); g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x, y, s, s, s * 0.1); g.fill();
  g.lineWidth = Math.max(3, s * 0.035); g.strokeStyle = accent; g.stroke();
  const mx = matrix(text || SAMPLE_QR), n = mx.size, pad = s * 0.07, ms = (s - 2 * pad) / (n + 2);
  g.fillStyle = "#0a0a0a"; const qx = x + pad + ms, qy = y + pad + ms;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (mx.get(r, c)) g.fillRect(qx + c * ms - 0.2, qy + r * ms - 0.2, ms + 0.4, ms + 0.4);
  g.restore();
}
function pill(g: CanvasRenderingContext2D, text: string, cx: number, cy: number, h: number, bg: string, fg: string) {
  g.save(); g.font = FONT(900, h * 0.52); const w = g.measureText(text).width + h * 0.9;
  g.fillStyle = bg; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.3); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cx, cy + h * 0.03); g.restore();
}


/** A phone with a screenshot of the profile, or a plain profile layout (no made-up numbers) when there is no screenshot. */
function drawPhone(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOpts, th: { bg: string; fg: string; accent: string }) {
  g.save(); g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = w * 0.06; g.shadowOffsetY = w * 0.025;
  g.fillStyle = "#101113"; g.beginPath(); g.roundRect(x, y, w, h, w * 0.13); g.fill(); g.shadowColor = "transparent";
  const m = w * 0.04, sx = x + m, sy = y + m, sw = w - 2 * m, sh = h - 2 * m, rad = w * 0.1;
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, rad); g.clip(); g.fillStyle = "#fff"; g.fillRect(sx, sy, sw, sh);
  if (o.shot) { const k = Math.max(sw / o.shot.w, sh / o.shot.h); g.drawImage(o.shot.src, sx + (sw - o.shot.w * k) / 2, sy, o.shot.w * k, o.shot.h * k); }
  else {
    const u = sw / 100; g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.fillStyle = "#111"; g.font = FONT(800, 6.2 * u); g.fillText("‹", sx + 6 * u, sy + 17 * u); g.font = FONT(800, 6 * u); g.fillText((o.handle || "yourshop").slice(0, 18), sx + 17 * u, sy + 17 * u);
    g.fillStyle = th.bg; g.beginPath(); g.arc(sx + 20 * u, sy + 37 * u, 11 * u, 0, 7); g.fill();
    if (o.logo) { g.save(); g.beginPath(); g.arc(sx + 20 * u, sy + 37 * u, 10 * u, 0, 7); g.clip(); g.fillStyle = "#fff"; g.fillRect(sx + 9 * u, sy + 26 * u, 22 * u, 22 * u); const k = Math.min(18 * u / o.logo.w, 18 * u / o.logo.h); g.drawImage(o.logo.src, sx + 20 * u - (o.logo.w * k) / 2, sy + 37 * u - (o.logo.h * k) / 2, o.logo.w * k, o.logo.h * k); g.restore(); }
    else { g.fillStyle = th.fg; g.font = FONT(900, 11 * u); g.textAlign = "center"; g.fillText((o.shop.trim()[0] || "Y").toUpperCase(), sx + 20 * u, sy + 41 * u); g.textAlign = "left"; }
    g.fillStyle = "#111"; g.font = FONT(800, 5.6 * u); g.fillText(o.shop.trim().slice(0, 22) || "Your shop name", sx + 6 * u, sy + 60 * u);
    g.fillStyle = "#555"; g.font = FONT(500, 4.6 * u); let by = sy + 69 * u; for (const l of wrap(g, o.sub.trim() || "Follow us for new things", 86 * u).slice(0, 2)) { g.fillText(l, sx + 6 * u, by); by += 6.2 * u; }
    g.fillStyle = th.bg; g.beginPath(); g.roundRect(sx + 6 * u, sy + 84 * u, 42 * u, 11 * u, 3 * u); g.fill(); g.fillStyle = th.fg; g.font = FONT(800, 4.8 * u); g.textAlign = "center"; g.fillText("Follow", sx + 27 * u, sy + 91.3 * u);
    g.fillStyle = "#e5e5e5"; g.beginPath(); g.roundRect(sx + 52 * u, sy + 84 * u, 42 * u, 11 * u, 3 * u); g.fill(); g.fillStyle = "#111"; g.fillText("Message", sx + 73 * u, sy + 91.3 * u); g.textAlign = "left";
    for (let i = 0; i < 4; i++) { g.fillStyle = "#e5e5e5"; g.beginPath(); g.arc(sx + (14 + i * 24) * u, sy + 111 * u, 8 * u, 0, 7); g.fill(); }
    const tint = [th.bg, "#d4d4d8", th.accent, "#e5e5e5", "#d4d4d8", th.bg];
    for (let i = 0; i < 9; i++) { g.fillStyle = tint[i % tint.length]; g.globalAlpha = 0.55; g.fillRect(sx + (i % 3) * (sw / 3) + 0.6 * u, sy + 126 * u + Math.floor(i / 3) * (sw / 3) + 0.6 * u, sw / 3 - 1.2 * u, sw / 3 - 1.2 * u); }
    g.globalAlpha = 1;
  }
  g.restore();
  g.fillStyle = "#101113"; g.beginPath(); g.roundRect(x + w * 0.32, y + m * 0.9, w * 0.36, m * 1.5, m); g.fill(); g.restore();
}

export interface Built { art: HTMLCanvasElement; hole: { x: number; y: number; r: number } | null; crease: { x: number; y0: number; y1: number; x2?: number } | null }

/** Builds the finished artwork (transparent outside the cut shape). */
export function buildCard(fig: HTMLCanvasElement, o: CardOpts): Built {
  const th = THEMES.find((t) => t.id === o.theme) ?? THEMES[0];
  const r = Math.max(0, Math.round((o.border / 100) * fig.height)), H0 = halo(fig, r), FW = H0.c.width, FH = H0.c.height;
  const fl = mk(FW, FH), fg = fl.getContext("2d")!; fg.drawImage(H0.c, 0, 0); fg.drawImage(fig, H0.pad, H0.pad);
  let hole: Built["hole"] = null, crease: Built["crease"] = null;

  if (o.mode === "sticker" && !o.badge) return { art: fl, hole, crease };


  if (o.mode === "book") {
    // three panels: the left and right halves of the figure (the right one mirrored) hinge onto a middle panel with a phone page and a QR page
    const half = Math.round(FW / 2), W = half + FW + half, ph = Math.round(FH * 0.9), py = Math.round(FH * 0.05), art = mk(W, FH), g = art.getContext("2d")!;
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(half - 1, py, FW + 2, ph, Math.max(18, r * 1.6)); g.fill();
    const ix = half + r, iy = py + r, iw = FW - 2 * r, ih = ph - 2 * r, pgw = iw / 2;
    g.fillStyle = th.bg; g.globalAlpha = 0.14; g.beginPath(); g.roundRect(ix, iy, pgw, ih, Math.max(12, ih * 0.04)); g.fill(); g.globalAlpha = 1;
    g.fillStyle = "#fffdf6"; g.beginPath(); g.roundRect(ix + pgw, iy, pgw, ih, Math.max(12, ih * 0.04)); g.fill();
    // left page: phone
    const pW = Math.min(ih * 0.9 * 0.47, pgw * 0.88), pHt = pW / 0.47; drawPhone(g, ix + (pgw - pW) / 2, iy + (ih - pHt) / 2, pW, pHt, o, th);
    // right page: logo or name, tagline, QR, SCAN ME
    const rx = ix + pgw, cx = rx + pgw / 2; g.textAlign = "center"; g.textBaseline = "alphabetic";
    let ty = iy + ih * 0.08;
    if (o.logo) { const lh = ih * 0.2, k = Math.min((pgw * 0.8) / o.logo.w, lh / o.logo.h); g.drawImage(o.logo.src, cx - (o.logo.w * k) / 2, ty, o.logo.w * k, o.logo.h * k); ty += o.logo.h * k + ih * 0.03; }
    let fs = Math.min(ih * 0.075, pgw * 0.16); g.font = FONT(900, fs); g.fillStyle = th.bg; let nm = (o.shop || "").trim().toUpperCase().slice(0, 26) || " ";
    while (g.measureText(nm).width > pgw * 0.86 && fs > 12) { fs -= 1; g.font = FONT(900, fs); }
    g.fillText(nm, cx, ty + fs); ty += fs * 1.35;
    if (o.sub.trim()) { let ss = Math.min(ih * 0.036, pgw * 0.075); g.font = FONT(600, ss); g.fillStyle = "#57534e"; for (const l of wrap(g, o.sub.trim(), pgw * 0.84).slice(0, 2)) { g.fillText(l, cx, ty + ss); ty += ss * 1.3; } ty += ss * 0.3; }
    const qs = Math.min(pgw * 0.84, ih - (ty - iy) - ih * 0.2), qy = ty + ih * 0.015;
    qrCard(g, o.qr, cx - qs / 2, qy, qs, th.bg);
    pill(g, (o.cta || "SCAN ME").slice(0, 14), cx, Math.min(iy + ih - ih * 0.055, qy + qs + ih * 0.075), Math.max(28, ih * 0.085), th.bg, th.fg);
    if (o.phone.trim()) { g.font = FONT(800, ih * 0.03); g.fillStyle = "#44403c"; g.fillText(o.phone.trim().slice(0, 22), cx, iy + ih - ih * 0.005); }
    // the two halves of the figure
    const lf = mk(half + 1, FH), lg = lf.getContext("2d")!; lg.drawImage(fl, 0, 0, half + 1, FH, 0, 0, half + 1, FH);
    g.save(); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = Math.max(5, r * 0.7); g.drawImage(lf, 0, 0); g.restore(); g.drawImage(lf, 0, 0);
    const rt = mk(FW - half + 1, FH), rg = rt.getContext("2d")!; rg.translate(rt.width, 0); rg.scale(-1, 1); rg.drawImage(fl, half - 1, 0, FW - half + 1, FH, 0, 0, FW - half + 1, FH);
    g.save(); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = Math.max(5, r * 0.7); g.drawImage(rt, half + FW - 1, 0); g.restore(); g.drawImage(rt, half + FW - 1, 0);
    return { art, hole, crease: { x: half, y0: py, y1: py + ph, x2: half + FW } };
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
export function contourOf(art: HTMLCanvasElement): [number, number][] {
  const m = Math.min(1, 700 / Math.max(art.width, art.height)), w = Math.max(2, Math.round(art.width * m)), h = Math.max(2, Math.round(art.height * m));
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
