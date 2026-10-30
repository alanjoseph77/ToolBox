import { PDFDocument } from "pdf-lib";

/** Parses "1-3, 5, 8-10" into zero-based page indices. */
export function parseRanges(input: string, total: number): number[] {
  const out: number[] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid range "${part}"`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside 1-${total}`);
    for (let p = a; p <= b; p++) out.push(p - 1);
  }
  if (!out.length) throw new Error("Enter at least one page or range");
  return out;
}

export async function pageCount(base64: string): Promise<number> {
  return (await PDFDocument.load(base64, { ignoreEncryption: true })).getPageCount();
}

export async function mergePdfs(pdfs: string[]): Promise<string> {
  const out = await PDFDocument.create();
  for (const b64 of pdfs) {
    const src = await PDFDocument.load(b64, { ignoreEncryption: true });
    (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
  }
  return out.saveAsBase64();
}

export async function extractPages(base64: string, indices: number[]): Promise<string> {
  const src = await PDFDocument.load(base64, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  (await out.copyPages(src, indices)).forEach((p) => out.addPage(p));
  return out.saveAsBase64();
}

/** One image per page. Images must already be JPEG (the screen normalises them first). */
export async function jpegsToPdf(jpegBase64: string[]): Promise<string> {
  const pdf = await PDFDocument.create();
  for (const b64 of jpegBase64) {
    const img = await pdf.embedJpg(b64);
    pdf.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return pdf.saveAsBase64();
}
