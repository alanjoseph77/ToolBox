// Pure PDF operations built on pdf-lib. Used by both the website and the mobile app
// (mobile/src/lib/pdfOps.ts is an identical copy, kept in sync by scripts/sync-pdfops.mjs).
import { PDFDocument, PDFPage, StandardFonts, degrees, rgb, PageSizes } from "pdf-lib";

export type PdfInput = Uint8Array | ArrayBuffer | string; // bytes, or a base64 string
export interface NamedPdf { name: string; bytes: Uint8Array }

const load = (src: PdfInput) => PDFDocument.load(src, { ignoreEncryption: true, updateMetadata: false });
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// Standard PDF fonts only cover Latin-1; replace anything else so drawing never throws.
export const latin1 = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

export async function pageCountOf(src: PdfInput): Promise<number> {
  return (await load(src)).getPageCount();
}

/** Interleaves pages: A1, B1, A2, B2, ... Handy for merging front-side and back-side scans. */
export async function alternateMix(inputs: PdfInput[], reverse: boolean[] = []): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const lists: PDFPage[][] = [];
  for (let i = 0; i < inputs.length; i++) {
    const src = await load(inputs[i]);
    const idx = range(src.getPageCount());
    if (reverse[i]) idx.reverse();
    lists.push(await out.copyPages(src, idx));
  }
  const longest = Math.max(...lists.map((l) => l.length));
  for (let p = 0; p < longest; p++) for (const l of lists) if (p < l.length) out.addPage(l[p]);
  return out.save();
}

/** Unrotated-page rectangles for the two visual halves of a page. */
function halfRects(box: { x: number; y: number; width: number; height: number }, rotation: number, mode: "vertical" | "horizontal") {
  const { x, y, width: w, height: h } = box;
  const left = { x, y, width: w / 2, height: h }, right = { x: x + w / 2, y, width: w / 2, height: h };
  const bottom = { x, y, width: w, height: h / 2 }, top = { x, y: y + h / 2, width: w, height: h / 2 };
  const r = ((rotation % 360) + 360) % 360;
  // vertical cut => visual left | right ; horizontal cut => visual top | bottom
  if (mode === "vertical") return r === 0 ? [left, right] : r === 90 ? [bottom, top] : r === 180 ? [right, left] : [top, bottom];
  return r === 0 ? [top, bottom] : r === 90 ? [left, right] : r === 180 ? [bottom, top] : [right, left];
}

/** Cuts every page in two (for book scans with two pages per image). */
export async function splitInHalf(src: PdfInput, mode: "vertical" | "horizontal" = "vertical", rightToLeft = false): Promise<Uint8Array> {
  const doc = await load(src);
  const out = await PDFDocument.create();
  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i);
    const rects = halfRects(page.getMediaBox(), page.getRotation().angle, mode);
    const halves = rightToLeft ? [rects[1], rects[0]] : rects;
    for (const r of halves) {
      const [copy] = await out.copyPages(doc, [i]);
      copy.setMediaBox(r.x, r.y, r.width, r.height);
      copy.setCropBox(r.x, r.y, r.width, r.height);
      out.addPage(copy);
    }
  }
  return out.save();
}

/** Splits into several PDFs that are each at most `maxBytes` (a single huge page can exceed it). */
export async function splitBySize(src: PdfInput, maxBytes: number): Promise<Uint8Array[]> {
  const doc = await load(src);
  const n = doc.getPageCount();
  const build = async (idx: number[]) => { const o = await PDFDocument.create(); (await o.copyPages(doc, idx)).forEach((p) => o.addPage(p)); return o.save(); };
  const parts: Uint8Array[] = [];
  let start = 0;
  while (start < n) {
    // grow the chunk with a doubling search, then back off one page at a time until it fits
    let end = start + 1, best = await build([start]);
    for (let step = 1; end < n; step *= 2) {
      const tryEnd = Math.min(n, end + step);
      const bytes = await build(range(tryEnd - start).map((k) => start + k));
      if (bytes.length > maxBytes) break;
      end = tryEnd; best = bytes;
    }
    while (end < n) { // linear fill after the doubling stopped
      const bytes = await build(range(end + 1 - start).map((k) => start + k));
      if (bytes.length > maxBytes) break;
      end += 1; best = bytes;
    }
    parts.push(best);
    start = end;
  }
  return parts;
}

/** One PDF per page. */
export async function splitEveryPage(src: PdfInput): Promise<Uint8Array[]> {
  const doc = await load(src);
  const parts: Uint8Array[] = [];
  for (let i = 0; i < doc.getPageCount(); i++) {
    const o = await PDFDocument.create();
    o.addPage((await o.copyPages(doc, [i]))[0]);
    parts.push(await o.save());
  }
  return parts;
}

export async function extractRange(src: PdfInput, indices: number[]): Promise<Uint8Array> {
  const doc = await load(src);
  const out = await PDFDocument.create();
  (await out.copyPages(doc, indices)).forEach((p) => out.addPage(p));
  return out.save();
}

export type PageSelect = "all" | "odd" | "even" | number[];
const selects = (sel: PageSelect, i: number) => sel === "all" || (sel === "odd" ? i % 2 === 0 : sel === "even" ? i % 2 === 1 : sel.includes(i));

export async function rotatePages(src: PdfInput, angle: 90 | 180 | 270, which: PageSelect = "all"): Promise<Uint8Array> {
  const doc = await load(src);
  doc.getPages().forEach((p, i) => { if (selects(which, i)) p.setRotation(degrees((p.getRotation().angle + angle) % 360)); });
  return doc.save();
}

/** Mirrors every page left-to-right ("horizontal") or top-to-bottom ("vertical"). */
export async function flipPages(src: PdfInput, axis: "horizontal" | "vertical" = "horizontal"): Promise<Uint8Array> {
  const doc = await load(src);
  const out = await PDFDocument.create();
  for (const page of doc.getPages()) {
    const { width: w, height: h } = page.getSize();
    const rot = ((page.getRotation().angle % 360) + 360) % 360;
    const np = out.addPage([w, h]);
    np.setRotation(degrees(rot));
    const emb = await out.embedPage(page);
    // the flip happens in the page's own (unrotated) space, so swap the axis for 90/270 pages
    const horizontalInPageSpace = (axis === "horizontal") !== (rot === 90 || rot === 270);
    if (horizontalInPageSpace) np.drawPage(emb, { x: w, y: 0, width: -w, height: h });
    else np.drawPage(emb, { x: 0, y: h, width: w, height: -h });
  }
  return out.save();
}

export type SheetSize = "A4" | "A3" | "A5" | "Letter" | "Legal";
export const sheetSizes: Record<SheetSize, [number, number]> = { A4: PageSizes.A4, A3: PageSizes.A3, A5: PageSizes.A5, Letter: PageSizes.Letter, Legal: PageSizes.Legal };

const GRIDS: Record<number, { cols: number; rows: number; landscape: boolean }> = {
  2: { cols: 2, rows: 1, landscape: true }, 4: { cols: 2, rows: 2, landscape: false },
  6: { cols: 3, rows: 2, landscape: true }, 9: { cols: 3, rows: 3, landscape: false }, 16: { cols: 4, rows: 4, landscape: false },
};
export const perSheetOptions = [2, 4, 6, 9, 16] as const;

/** Puts several pages on each sheet (handouts, saving paper). */
export async function nUp(src: PdfInput, perSheet: 2 | 4 | 6 | 9 | 16, size: SheetSize = "A4", border = true, margin = 24, gap = 10): Promise<Uint8Array> {
  const doc = await load(src);
  const out = await PDFDocument.create();
  const g = GRIDS[perSheet];
  const [sw, sh] = sheetSizes[size];
  const W = g.landscape ? Math.max(sw, sh) : Math.min(sw, sh), H = g.landscape ? Math.min(sw, sh) : Math.max(sw, sh);
  const cellW = (W - 2 * margin - gap * (g.cols - 1)) / g.cols, cellH = (H - 2 * margin - gap * (g.rows - 1)) / g.rows;
  const emb = await out.embedPages(doc.getPages());
  for (let i = 0; i < emb.length; i += perSheet) {
    const sheet = out.addPage([W, H]);
    for (let k = 0; k < perSheet && i + k < emb.length; k++) {
      const e = emb[i + k], col = k % g.cols, row = Math.floor(k / g.cols);
      const scale = Math.min(cellW / e.width, cellH / e.height);
      const w = e.width * scale, h = e.height * scale;
      const x = margin + col * (cellW + gap) + (cellW - w) / 2;
      const y = H - margin - row * (cellH + gap) - cellH + (cellH - h) / 2;
      sheet.drawPage(e, { x, y, width: w, height: h });
      if (border) sheet.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5 });
    }
  }
  return out.save();
}

export interface CropResizeOptions { top?: number; right?: number; bottom?: number; left?: number; unit?: "pt" | "mm"; target?: SheetSize | "none" }

/** Trims margins and/or fits every page onto a standard paper size. */
export async function cropResize(src: PdfInput, o: CropResizeOptions): Promise<Uint8Array> {
  const doc = await load(src);
  const k = o.unit === "mm" ? 72 / 25.4 : 1;
  const [t, r, b, l] = [o.top, o.right, o.bottom, o.left].map((v) => Math.max(0, (v ?? 0) * k));
  const target = o.target && o.target !== "none" ? sheetSizes[o.target] : null;
  if (!target) {
    for (const p of doc.getPages()) {
      const m = p.getMediaBox();
      const x = m.x + l, y = m.y + b, w = m.width - l - r, h = m.height - t - b;
      if (w <= 1 || h <= 1) throw new Error("Margins are larger than the page.");
      p.setCropBox(x, y, w, h); p.setMediaBox(x, y, w, h);
    }
    return doc.save();
  }
  const out = await PDFDocument.create();
  for (const p of doc.getPages()) {
    const m = p.getMediaBox();
    const bb = { left: m.x + l, bottom: m.y + b, right: m.x + m.width - r, top: m.y + m.height - t };
    if (bb.right - bb.left <= 1 || bb.top - bb.bottom <= 1) throw new Error("Margins are larger than the page.");
    const e = await out.embedPage(p, bb);
    const landscape = e.width > e.height;
    const W = landscape ? Math.max(...target) : Math.min(...target), H = landscape ? Math.min(...target) : Math.max(...target);
    const s = Math.min(W / e.width, H / e.height);
    out.addPage([W, H]).drawPage(e, { x: (W - e.width * s) / 2, y: (H - e.height * s) / 2, width: e.width * s, height: e.height * s });
  }
  return out.save();
}

export interface WatermarkOptions { text: string; size?: number; opacity?: number; angle?: number; color?: string; tile?: boolean }
const hexToRgb = (hex: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex); const n = m ? parseInt(m[1], 16) : 0x808080; return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

export async function addWatermark(src: PdfInput, o: WatermarkOptions): Promise<Uint8Array> {
  const doc = await load(src);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = latin1(o.text).trim();
  if (!text) throw new Error("Enter the watermark text.");
  const size = o.size ?? 48, angle = o.angle ?? 45, color = hexToRgb(o.color ?? "#888888"), opacity = o.opacity ?? 0.25;
  const rad = (angle * Math.PI) / 180, tw = font.widthOfTextAtSize(text, size), th = font.heightAtSize(size) * 0.7;
  const stamp = (page: PDFPage, cx: number, cy: number) => {
    // rotate about the text's centre, not its baseline origin
    const x = cx - (tw / 2) * Math.cos(rad) + (th / 2) * Math.sin(rad), y = cy - (tw / 2) * Math.sin(rad) - (th / 2) * Math.cos(rad);
    page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
  };
  for (const page of doc.getPages()) {
    const { width: w, height: h } = page.getSize();
    if (!o.tile) { stamp(page, w / 2, h / 2); continue; }
    const stepX = tw + size * 2, stepY = size * 4;
    for (let y = -h; y < h * 2; y += stepY) for (let x = -w; x < w * 2; x += stepX) if (x > -tw && x < w + tw && y > -tw && y < h + tw) stamp(page, x + tw / 2, y);
  }
  return doc.save();
}

export type NumberPosition = "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";
export interface PageNumberOptions { format?: string; position?: NumberPosition; size?: number; start?: number; skipFirst?: boolean; margin?: number }
export const numberPositions: NumberPosition[] = ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"];

/** Format tokens: {n} the page number, {total} the page count. */
export async function addPageNumbers(src: PdfInput, o: PageNumberOptions = {}): Promise<Uint8Array> {
  const doc = await load(src);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = o.size ?? 11, margin = o.margin ?? 28, start = o.start ?? 1, pos = o.position ?? "bottom-center";
  const total = doc.getPageCount();
  doc.getPages().forEach((page, i) => {
    if (o.skipFirst && i === 0) return;
    const label = latin1((o.format ?? "{n}").replace(/\{n\}/g, String(start + i - (o.skipFirst ? 1 : 0))).replace(/\{total\}/g, String(total - (o.skipFirst ? 1 : 0))));
    const tw = font.widthOfTextAtSize(label, size), { width: w, height: h } = page.getSize();
    const x = pos.endsWith("left") ? margin : pos.endsWith("right") ? w - margin - tw : (w - tw) / 2;
    const y = pos.startsWith("top") ? h - margin - size : margin;
    page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return doc.save();
}

export interface PdfDetails { title?: string; author?: string; subject?: string; keywords?: string; creator?: string; producer?: string }

export async function readDetails(src: PdfInput): Promise<PdfDetails> {
  const d = await load(src);
  return { title: d.getTitle() ?? "", author: d.getAuthor() ?? "", subject: d.getSubject() ?? "", keywords: d.getKeywords() ?? "", creator: d.getCreator() ?? "", producer: d.getProducer() ?? "" };
}

export async function setDetails(src: PdfInput, o: PdfDetails): Promise<Uint8Array> {
  const d = await load(src);
  d.setTitle(o.title ?? ""); d.setAuthor(o.author ?? ""); d.setSubject(o.subject ?? "");
  d.setKeywords((o.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean));
  d.setCreator(o.creator ?? ""); d.setProducer(o.producer ?? "");
  return d.save();
}

/** Builds a PDF with one JPEG per page (used by scan, compress and redact on the web). */
export async function jpegPagesToPdf(pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const p of pages) {
    const img = await out.embedJpg(p.jpeg);
    out.addPage([p.widthPt, p.heightPt]).drawImage(img, { x: 0, y: 0, width: p.widthPt, height: p.heightPt });
  }
  return out.save();
}
