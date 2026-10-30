const rgbOf = (hex: string) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

/** Turns a photo of a signature on paper into dark ink on a transparent background. */
export function inkFromPhoto(src: HTMLCanvasElement, threshold: number, color: string): HTMLCanvasElement {
  const out = document.createElement("canvas"); out.width = src.width; out.height = src.height;
  const g = out.getContext("2d")!; g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, out.width, out.height), d = img.data, [r, gr, b] = rgbOf(color);
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const a = lum >= threshold ? 0 : Math.min(255, Math.round(((threshold - lum) / threshold) * 255 * 1.8));
    d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = a;
  }
  g.putImageData(img, 0, 0);
  return out;
}

/** Crops to the visible ink (plus padding) and optionally scales to a width. */
export function trimAndScale(src: HTMLCanvasElement, pad = 12, width?: number): HTMLCanvasElement | null {
  const g = src.getContext("2d")!, { width: W, height: H } = src, d = g.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = width ? width / w : 1;
  const out = document.createElement("canvas"); out.width = Math.round(w * k); out.height = Math.round(h * k);
  const og = out.getContext("2d")!; og.imageSmoothingQuality = "high";
  og.drawImage(src, x0, y0, w, h, 0, 0, out.width, out.height);
  return out;
}
