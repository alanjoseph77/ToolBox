import { canvasToBlob, loadImage } from "./files";

export type Fmt = "jpeg" | "png" | "webp";
export const fmtMime: Record<Fmt, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const fmtExt: Record<Fmt, string> = { jpeg: "jpg", png: "png", webp: "webp" };

export interface PipelineOptions {
  resize: { on: boolean; mode: "fit" | "exact" | "percent"; w: number; h: number; pct: number };
  compress: { on: boolean; kb: number };
  format: Fmt;
}

export interface PipelineResult { blob: Blob; w: number; h: number; note?: string }

/** Resize, then convert, then compress to a target size, all on one canvas (no re-upload between steps). */
export async function runPipeline(file: Blob, o: PipelineOptions): Promise<PipelineResult> {
  const img = await loadImage(file);
  let w = img.width, h = img.height;
  if (o.resize.on) {
    if (o.resize.mode === "percent") { w = Math.round(w * (o.resize.pct / 100)); h = Math.round(h * (o.resize.pct / 100)); }
    else if (o.resize.mode === "exact") { w = o.resize.w || w; h = o.resize.h || h; }
    else { const k = Math.min(1, (o.resize.w || Infinity) / w, (o.resize.h || Infinity) / h); w = Math.round(w * k); h = Math.round(h * k); }
  }
  const draw = (scale: number) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
    const g = c.getContext("2d")!;
    if (o.format === "jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); } // JPG has no transparency
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  };
  const mime = fmtMime[o.format];

  if (!o.compress.on) { const c = draw(1); return { blob: await canvasToBlob(c, mime, 0.92), w: c.width, h: c.height }; }
  if (o.format === "png") { const c = draw(1); return { blob: await canvasToBlob(c, mime), w: c.width, h: c.height, note: "PNG cannot be compressed to a size. Choose JPG or WebP." }; }

  const target = Math.max(5, o.compress.kb) * 1024;
  let scale = 1;
  for (let attempt = 0; attempt < 7; attempt++) {
    const c = draw(scale);
    let lo = 0.05, hi = 0.95, best: Blob | null = null;
    for (let i = 0; i < 8; i++) {
      const q = (lo + hi) / 2, b = await canvasToBlob(c, mime, q);
      if (b.size <= target) { best = b; lo = q; } else hi = q;
    }
    if (best) return { blob: best, w: c.width, h: c.height, note: scale < 1 ? "Reduced the pixel size a little to reach the target." : undefined };
    scale *= 0.85;
  }
  const c = draw(scale);
  return { blob: await canvasToBlob(c, mime, 0.05), w: c.width, h: c.height, note: "Could not reach that size. This is the smallest result." };
}
