import { PDFDocument } from "pdf-lib";

/** One JPEG (base64) per page. `a4` fits each page on an A4 sheet with a small margin. */
export async function buildScanPdf(pages: { b64: string; w: number; h: number }[], a4: boolean): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const p of pages) {
    const img = await out.embedJpg(p.b64);
    const w = (p.w * 72) / 200, h = (p.h * 72) / 200; // assume roughly 200 dpi photos
    if (!a4) { out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h }); continue; }
    const m = 18, landscape = w > h, pw = landscape ? 841.89 : 595.28, ph = landscape ? 595.28 : 841.89;
    const s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h);
    out.addPage([pw, ph]).drawImage(img, { x: (pw - w * s) / 2, y: (ph - h * s) / 2, width: w * s, height: h * s });
  }
  return out.save();
}
