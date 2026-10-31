export interface Rect { x: number; y: number; w: number; h: number }
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
export type BlurMode = "blur" | "pixelate";

export function clampRect(r: Rect, width: number, height: number): Rect | null {
  const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(width, Math.ceil(r.x + r.w)), y1 = Math.min(height, Math.ceil(r.y + r.h));
  return x1 - x0 >= 1 && y1 - y0 >= 1 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** One sliding-window box blur pass along a row or column of `n` pixels (edges repeat). */
function pass(src: Uint8ClampedArray, dst: Uint8ClampedArray, n: number, start: number, step: number, radius: number) {
  const size = radius * 2 + 1;
  for (let c = 0; c < 4; c++) {
    const at = (i: number) => src[start + Math.min(n - 1, Math.max(0, i)) * step + c];
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += at(i);
    for (let i = 0; i < n; i++) {
      dst[start + i * step + c] = Math.round(sum / size);
      sum += at(i + radius + 1) - at(i - radius);
    }
  }
}

function blurBuffer(buf: Uint8ClampedArray, w: number, h: number, radius: number) {
  const tmp = new Uint8ClampedArray(buf.length);
  for (let k = 0; k < 3; k++) { // three box passes approximate a Gaussian
    for (let y = 0; y < h; y++) pass(buf, tmp, w, y * w * 4, 4, radius);
    for (let x = 0; x < w; x++) pass(tmp, buf, h, x * 4, w * 4, radius);
  }
}

function pixelateBuffer(buf: Uint8ClampedArray, w: number, h: number, block: number) {
  for (let by = 0; by < h; by += block) for (let bx = 0; bx < w; bx += block) {
    const x1 = Math.min(w, bx + block), y1 = Math.min(h, by + block), n = (x1 - bx) * (y1 - by);
    const s = [0, 0, 0, 0];
    for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) for (let c = 0; c < 4; c++) s[c] += buf[(y * w + x) * 4 + c];
    for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) for (let c = 0; c < 4; c++) buf[(y * w + x) * 4 + c] = Math.round(s[c] / n);
  }
}

/** Blurs or pixelates one area of the image in place. `strength` is 1 to 10. */
export function obscure(img: Pixels, rect: Rect, mode: BlurMode, strength: number, ellipse = false): boolean {
  const r = clampRect(rect, img.width, img.height);
  if (!r) return false;
  const buf = new Uint8ClampedArray(r.w * r.h * 4);
  for (let y = 0; y < r.h; y++) {
    const from = ((r.y + y) * img.width + r.x) * 4;
    buf.set(img.data.subarray(from, from + r.w * 4), y * r.w * 4);
  }
  const scale = Math.max(r.w, r.h) / 60; // bigger areas need a bigger effect to hide detail
  const s = Math.min(10, Math.max(1, strength));
  if (mode === "blur") blurBuffer(buf, r.w, r.h, Math.max(2, Math.round(s * Math.max(1, scale))));
  else pixelateBuffer(buf, r.w, r.h, Math.max(3, Math.round(s * 1.6 * Math.max(1, scale))));
  const cx = r.w / 2, cy = r.h / 2;
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    if (ellipse && ((x + 0.5 - cx) / cx) ** 2 + ((y + 0.5 - cy) / cy) ** 2 > 1) continue;
    const i = ((r.y + y) * img.width + r.x + x) * 4, j = (y * r.w + x) * 4;
    for (let c = 0; c < 4; c++) img.data[i + c] = buf[j + c];
  }
  return true;
}
