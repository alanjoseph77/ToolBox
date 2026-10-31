import { canvasToBlob } from "./files";

/** Draws the image at exactly w by h pixels. "crop" fills the box and trims the edges; "stretch" squeezes the whole picture in. */
export function fitCanvas(img: CanvasImageSource & { width: number; height: number }, w: number, h: number, mode: "crop" | "stretch"): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = "high";
  if (mode === "stretch") g.drawImage(img, 0, 0, w, h);
  else {
    const k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k;
    g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  }
  return c;
}

/** Largest JPEG quality whose file stays within maxKb. The pixel size is not changed. */
export async function jpegWithinKb(c: HTMLCanvasElement, maxKb: number): Promise<{ blob: Blob; quality: number; reached: boolean }> {
  const limit = maxKb * 1024;
  let lo = 0.05, hi = 0.95, best: { blob: Blob; quality: number } | null = null;
  for (let i = 0; i < 9; i++) {
    const q = (lo + hi) / 2, b = await canvasToBlob(c, "image/jpeg", q);
    if (b.size <= limit) { best = { blob: b, quality: q }; lo = q; } else hi = q;
  }
  if (best) return { ...best, reached: true };
  return { blob: await canvasToBlob(c, "image/jpeg", 0.05), quality: 0.05, reached: false };
}
