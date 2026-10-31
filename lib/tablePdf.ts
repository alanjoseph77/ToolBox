import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/₹/g, "Rs.").replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

export interface TableSheet { name: string; rows: string[][] }

function fit(text: string, font: PDFFont, size: number, max: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean), lines: string[] = [];
  let line = "";
  for (let w of words) {
    while (font.widthOfTextAtSize(w, size) > max && w.length > 1) { // a single very long word is cut
      let n = w.length - 1; while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > max) n--;
      if (line) { lines.push(line); line = ""; }
      lines.push(w.slice(0, n)); w = w.slice(n);
    }
    const next = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(next, size) <= max) line = next; else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Draws tables as PDF pages: one section per sheet, header row repeated on every page, landscape when the table is wide. */
export async function tablesToPdf(sheets: TableSheet[], opts: { header?: boolean } = {}): Promise<Uint8Array> {
  const header = opts.header ?? true;
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 8.5, pad = 3, M = 32;
  for (const sheet of sheets) {
    const rows = sheet.rows.filter((r) => r.some((c) => c.trim()));
    if (!rows.length) continue;
    const cols = Math.max(...rows.map((r) => r.length));
    // ideal width of each column (capped), then shrink to the page
    const ideal = Array.from({ length: cols }, (_, c) => Math.min(220, Math.max(28, ...rows.slice(0, 200).map((r) => reg.widthOfTextAtSize(safe(r[c] ?? ""), size) + 2 * pad))));
    const total = ideal.reduce((a, b) => a + b, 0);
    const landscape = total > 595 - 2 * M;
    const W = landscape ? 841.89 : 595.28, H = landscape ? 595.28 : 841.89, avail = W - 2 * M;
    const widths = total > avail ? ideal.map((w) => Math.max(24, (w / total) * avail)) : ideal;
    let page = pdf.addPage([W, H]), y = H - M;
    page.drawText(safe(sheet.name), { x: M, y: y - 10, size: 11, font: bold, color: rgb(0.05, 0.05, 0.05) }); y -= 24;
    const drawRow = (r: string[], isHead: boolean) => {
      const cells = widths.map((w, c) => fit(r[c] ?? "", isHead ? bold : reg, size, w - 2 * pad));
      const h = Math.max(...cells.map((l) => l.length)) * (size + 2) + 2 * pad - 2;
      if (y - h < M) { page = pdf.addPage([W, H]); y = H - M; if (header && !isHead && rows.length) drawRow(rows[0], true); }
      let x = M;
      if (isHead) page.drawRectangle({ x: M, y: y - h, width: widths.reduce((a, b) => a + b, 0), height: h, color: rgb(0.93, 0.93, 0.93) });
      cells.forEach((lines, c) => {
        lines.forEach((l, k) => page.drawText(l, { x: x + pad, y: y - pad - size - k * (size + 2) + 2, size, font: isHead ? bold : reg, color: rgb(0.1, 0.1, 0.1) }));
        x += widths[c];
      });
      page.drawLine({ start: { x: M, y: y - h }, end: { x: M + widths.reduce((a, b) => a + b, 0), y: y - h }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) });
      y -= h;
    };
    rows.forEach((r, i) => drawRow(r, header && i === 0));
  }
  if (!pdf.getPageCount()) pdf.addPage();
  return pdf.save();
}
