// Picture QR: a photo fills the code and the QR pattern is drawn as small dots on top of it, so the picture shows
// through. The finder squares, timing lines and other fixed parts stay solid so phones can still lock on. Everything is
// drawn on a canvas in the browser; the picture never leaves the device.
import QRCode from "qrcode";

export type PicFrame = "plain" | "card" | "stamp";
export interface PicOpts {
  zoom: number; x: number; y: number;           // framing: 1 = picture fills the code; x, y move it (-1 … 1)
  brightness: number; contrast: number; saturation: number;
  strength: number;                              // how strongly the picture shows (0.3 … 1)
  dot: number;                                   // dot size as a share of one QR square (0.3 … 0.7)
  frame: PicFrame;
}
export const PIC_DEFAULTS: PicOpts = { zoom: 1, x: 0, y: 0, brightness: 1, contrast: 1.1, saturation: 1, strength: 1, dot: 0.55, frame: "card" };
export const BASE = 800;                         // 1× download size in pixels

type Matrix = { size: number; get(r: number, c: number): number; isReserved(r: number, c: number): boolean | number };
export const qrMatrix = (text: string): Matrix => QRCode.create(text || " ", { errorCorrectionLevel: "H" }).modules as unknown as Matrix;

/** Fits the picture into a square (cover), applies zoom, position and colour settings. Done once at 1024 px, so even an
 *  8× download does not need a huge pixel loop. */
export function preparePicture(img: CanvasImageSource, w: number, h: number, o: PicOpts, size = 1024): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, size, size);
  const cover = Math.max(size / w, size / h) * o.zoom, dw = w * cover, dh = h * cover;
  const dx = (size - dw) / 2 + o.x * Math.max(0, dw - size) / 2, dy = (size - dh) / 2 + o.y * Math.max(0, dh - size) / 2;
  g.imageSmoothingQuality = "high"; g.drawImage(img, dx, dy, dw, dh);
  if (o.brightness !== 1 || o.contrast !== 1 || o.saturation !== 1) {
    const id = g.getImageData(0, 0, size, size), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] * o.brightness, gg = d[i + 1] * o.brightness, b = d[i + 2] * o.brightness;
      r = (r - 128) * o.contrast + 128; gg = (gg - 128) * o.contrast + 128; b = (b - 128) * o.contrast + 128;
      const l = 0.299 * r + 0.587 * gg + 0.114 * b;
      d[i] = l + (r - l) * o.saturation; d[i + 1] = l + (gg - l) * o.saturation; d[i + 2] = l + (b - l) * o.saturation;
    }
    g.putImageData(id, 0, 0);
  }
  return c;
}

/** Draws the finished picture QR into `canvas` at `px` × `px`. */
export function drawPictureQr(canvas: HTMLCanvasElement, text: string, pic: HTMLCanvasElement | null, o: PicOpts, px: number) {
  const mx = qrMatrix(text), n = mx.size, quiet = 4;
  const border = o.frame === "plain" ? 0 : o.frame === "card" ? 1.5 : 2.6;            // extra room around the white quiet zone
  const m = px / (n + 2 * quiet + 2 * border), ox = (border + quiet) * m, area = n * m;
  canvas.width = canvas.height = Math.round(px);
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, px, px);
  if (o.frame === "plain") { g.fillStyle = "#fff"; g.fillRect(0, 0, px, px); }
  else if (o.frame === "card") {
    const r = m * 2.6; g.fillStyle = "#fff"; g.beginPath(); g.roundRect(m * 0.25, m * 0.25, px - m * 0.5, px - m * 0.5, r); g.fill();
    g.strokeStyle = "#e5e5e5"; g.lineWidth = m * 0.18; g.stroke();
  } else {
    // a postage stamp: white paper with round bites taken out of every edge, and a thin line inside
    g.fillStyle = "#fff"; g.fillRect(0, 0, px, px);
    g.globalCompositeOperation = "destination-out";
    const hole = m * 0.62, step = m * 2;
    const count = Math.max(4, Math.round(px / step)), gap = px / count;
    for (let i = 0; i <= count; i++) for (const [x, y] of [[i * gap, 0], [i * gap, px], [0, i * gap], [px, i * gap]]) { g.beginPath(); g.arc(x, y, hole, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#d4d4d4"; g.lineWidth = m * 0.14; g.strokeRect(m * 1.5, m * 1.5, px - m * 3, px - m * 3);
  }
  if (pic) { g.globalAlpha = o.strength; g.imageSmoothingQuality = "high"; g.drawImage(pic, ox, ox, area, area); g.globalAlpha = 1; }
  const dot = m * o.dot, off = (m - dot) / 2;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    g.fillStyle = mx.get(r, c) ? "#000" : "#fff";
    const x = ox + c * m, y = ox + r * m;
    if (mx.isReserved(r, c) || !pic) g.fillRect(x, y, m + 0.5, m + 0.5);            // fixed parts stay solid
    else g.fillRect(x + off, y + off, dot, dot);                                      // data: a dot in the middle of the square
  }
}

/** Plain-language advice for the settings, shown under the preview. */
export function picAdvice(n: number, o: PicOpts): string[] {
  const out: string[] = [];
  if (n >= 45) out.push("The link is long, so the code has many small squares and the picture shows less. A shorter link gives a clearer picture.");
  if (o.dot < 0.48) out.push("Small dots look nicer but phone cameras miss them more often. Keep them at 50% or more if it will be printed small.");
  if (o.strength < 0.5) out.push("The picture is very faint. That scans well but looks plain.");
  return out;
}

/** A sample picture drawn in code (a sunset over hills), for people who just want to try it. */
export function samplePicture(size = 900): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d")!, w = size, h = size;
  let s = 7; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let gr = g.createLinearGradient(0, 0, 0, h * 0.6); gr.addColorStop(0, "#1e3a8a"); gr.addColorStop(0.5, "#f97316"); gr.addColorStop(1, "#fde68a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff7d6"; g.beginPath(); g.arc(w * 0.62, h * 0.47, w * 0.11, 0, 7); g.fill();
  const ridge = (y0: number, amp: number, col: string, k: number) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 6) g.lineTo(x, y0 - amp * (0.6 * Math.sin(x / 140 + k) + 0.4 * Math.sin(x / 47 + k * 2))); g.lineTo(w, h); g.closePath(); g.fill(); };
  ridge(h * 0.6, 60, "#7c3aed", 1); ridge(h * 0.68, 50, "#4c1d95", 2.4); ridge(h * 0.8, 40, "#1e1b4b", 4);
  g.fillStyle = "#0b1020"; for (let i = 0; i < 9; i++) { const x = rnd() * w, y = h * (0.86 + rnd() * 0.1), t = 70 + rnd() * 90; g.beginPath(); g.moveTo(x, y - t); g.lineTo(x - t * 0.3, y); g.lineTo(x + t * 0.3, y); g.closePath(); g.fill(); }
  return c;
}
