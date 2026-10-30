import { PDFDocument } from "pdf-lib";
import { jpegPagesToPdf } from "./pdfOps";
import { openPdfBytes, renderPage } from "./pdfjs";

const toJpeg = (c: HTMLCanvasElement, quality: number) =>
  new Promise<Uint8Array>((resolve, reject) => c.toBlob(async (b) => (b ? resolve(new Uint8Array(await b.arrayBuffer())) : reject(new Error("Encoding failed"))), "image/jpeg", quality));

/** Re-draws every page as a JPEG at the given resolution. Smaller for image-heavy PDFs; text stops being selectable. */
export async function rasterize(bytes: Uint8Array, dpi: number, quality: number): Promise<Uint8Array> {
  const pdf = await openPdfBytes(bytes);
  const pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const base = (await pdf.getPage(i)).getViewport({ scale: 1 });
    pages.push({ jpeg: await toJpeg(await renderPage(pdf, i, dpi / 72), quality), widthPt: base.width, heightPt: base.height });
  }
  return jpegPagesToPdf(pages);
}

const ATTEMPTS: [number, number][] = [[150, 0.7], [130, 0.6], [110, 0.5], [96, 0.45], [80, 0.4], [66, 0.35], [54, 0.3]];

/** Tries progressively stronger settings until the file fits `targetBytes`. */
export async function rasterizeToSize(bytes: Uint8Array, targetBytes: number): Promise<{ bytes: Uint8Array; reached: boolean }> {
  let last: Uint8Array = bytes;
  for (const [dpi, q] of ATTEMPTS) {
    last = await rasterize(bytes, dpi, q);
    if (last.length <= targetBytes) return { bytes: last, reached: true };
  }
  return { bytes: last, reached: false };
}

export type Rect = { x: number; y: number; w: number; h: number }; // fractions of the page (0..1), origin top-left

/** True redaction: pages with black boxes are flattened to images so the covered text is really gone. */
export async function redactPages(bytes: Uint8Array, rects: Record<number, Rect[]>): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pdf = await openPdfBytes(bytes);
  const out = await PDFDocument.create();
  for (let i = 0; i < src.getPageCount(); i++) {
    const marks = rects[i];
    if (!marks?.length) { out.addPage((await out.copyPages(src, [i]))[0]); continue; }
    const base = (await pdf.getPage(i + 1)).getViewport({ scale: 1 });
    const canvas = await renderPage(pdf, i + 1, 2.2);
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#000";
    for (const r of marks) g.fillRect(r.x * canvas.width, r.y * canvas.height, r.w * canvas.width, r.h * canvas.height);
    const img = await out.embedJpg(await toJpeg(canvas, 0.92));
    out.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
  }
  return out.save();
}

// ---- Scan filters (canvas) ----
export type ScanFilter = "original" | "enhance" | "gray" | "bw";

function levels(d: Uint8ClampedArray, perChannel: boolean) {
  const lo = [0, 0, 0], hi = [255, 255, 255];
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  const total = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; }
  for (let c = 0; c < 3; c++) {
    let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[c][v]; if (acc >= total * 0.01) { lo[c] = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[c][v]; if (acc >= total * 0.01) { hi[c] = v; break; } }
  }
  if (!perChannel) { const l = Math.min(...lo), h = Math.max(...hi); lo.fill(l); hi.fill(h); }
  for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, ((d[i + c] - lo[c]) * 255) / Math.max(1, hi[c] - lo[c])));
}

/** Turns a photo of a page into a clean "scan". Works in place on the canvas. */
export function applyScanFilter(canvas: HTMLCanvasElement, filter: ScanFilter) {
  if (filter === "original") return;
  const g = canvas.getContext("2d")!, img = g.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
  const W = canvas.width, H = canvas.height;
  if (filter === "enhance") { levels(d, false); g.putImageData(img, 0, 0); return; }
  for (let i = 0; i < d.length; i += 4) { const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = y; }
  if (filter === "gray") { levels(d, false); g.putImageData(img, 0, 0); return; }
  // black & white: adaptive threshold (compare each pixel with the average of its neighbourhood)
  const integral = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += d[(y * W + x) * 4]; integral[(y + 1) * (W + 1) + x + 1] = integral[y * (W + 1) + x + 1] + row; } }
  const r = Math.max(8, Math.round(Math.min(W, H) / 24));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
    const sum = integral[y1 * (W + 1) + x1] - integral[y0 * (W + 1) + x1] - integral[y1 * (W + 1) + x0] + integral[y0 * (W + 1) + x0];
    const mean = sum / ((x1 - x0) * (y1 - y0)), i = (y * W + x) * 4;
    const v = d[i] < mean * 0.9 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(img, 0, 0);
}

/** One JPEG per page; `a4` fits each page on an A4 sheet with a small margin. */
export async function buildScanPdf(pages: { jpeg: Uint8Array; w: number; h: number }[], a4: boolean): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const p of pages) {
    const img = await out.embedJpg(p.jpeg);
    if (!a4) { out.addPage([p.w, p.h]).drawImage(img, { x: 0, y: 0, width: p.w, height: p.h }); continue; }
    const [W, H] = [595.28, 841.89], m = 18, landscape = p.w > p.h;
    const pw = landscape ? H : W, ph = landscape ? W : H, s = Math.min((pw - 2 * m) / p.w, (ph - 2 * m) / p.h);
    out.addPage([pw, ph]).drawImage(img, { x: (pw - p.w * s) / 2, y: (ph - p.h * s) / 2, width: p.w * s, height: p.h * s });
  }
  return out.save();
}
