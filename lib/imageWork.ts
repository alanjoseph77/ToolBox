// Small helpers shared by the picture tools that work on pixels (Image Enhancer, Invert Image).
import { canvasToBlob, loadImage } from "./files";

export const MAX_SIDE = 8000;                    // longest side we will process in full (bigger pictures are scaled down to this)
export type Fmt = "jpeg" | "png" | "webp";
export const MIME: Record<Fmt, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const EXT: Record<Fmt, string> = { jpeg: "jpg", png: "png", webp: "webp" };
export const fmtOf = (f: File): Fmt => (/png/i.test(f.type) || /\.png$/i.test(f.name) ? "png" : /webp/i.test(f.type) || /\.webp$/i.test(f.name) ? "webp" : "jpeg");

export interface Opened { img: HTMLImageElement; url: string; w: number; h: number }
export async function openImage(file: File): Promise<Opened> { const img = await loadImage(file); return { img, url: URL.createObjectURL(file), w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }; }

/** A canvas holding the picture, scaled so its longest side is at most `max`. */
export function drawn(img: HTMLImageElement, max: number): { canvas: HTMLCanvasElement; scale: number } {
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, scale = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w0 * scale)); c.height = Math.max(1, Math.round(h0 * scale));
  const g = c.getContext("2d", { willReadFrequently: true })!; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height);
  return { canvas: c, scale };
}

/** Encodes a canvas. JPEG has no transparency, so it is drawn on white first. */
export async function encode(canvas: HTMLCanvasElement, fmt: Fmt, quality = 0.92): Promise<Blob> {
  if (fmt !== "jpeg") return canvasToBlob(canvas, MIME[fmt], quality);
  const c = document.createElement("canvas"); c.width = canvas.width; c.height = canvas.height;
  const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(canvas, 0, 0);
  return canvasToBlob(c, MIME.jpeg, quality);
}
export const baseName = (f: File) => f.name.replace(/\.[^.]+$/, "") || "image";
