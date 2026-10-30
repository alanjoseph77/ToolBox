import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export interface Block { text: string; style?: "h1" | "h2" | "h3" | "p" | "li"; bold?: boolean }

// Standard PDF fonts only cover Latin-1; replace anything else so drawing never throws.
const safe = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/•/g, "*")
    .replace(/…/g, "...").replace(/ /g, " ").replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "?");

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
      else { if (line) lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

const sizes = { h1: 20, h2: 16, h3: 13, p: 11, li: 11 } as const;

/** Lays out simple text blocks on A4 pages. */
export async function blocksToPdf(blocks: Block[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [W, H, M] = [595.28, 841.89, 56];
  let page = pdf.addPage([W, H]);
  let y = H - M;
  for (const b of blocks) {
    const style = b.style ?? "p", size = sizes[style];
    const font = b.bold || style.startsWith("h") ? bold : regular;
    const indent = style === "li" ? 14 : 0;
    const lines = wrap(safe(style === "li" ? b.text : b.text), font, size, W - 2 * M - indent);
    y -= style.startsWith("h") ? size * 0.6 : 2;
    lines.forEach((line, i) => {
      if (y - size < M) { page = pdf.addPage([W, H]); y = H - M; }
      y -= size * 1.35;
      if (style === "li" && i === 0) page.drawText("-", { x: M + 2, y, size, font });
      page.drawText(line, { x: M + indent, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    });
    y -= style === "p" || style === "li" ? 4 : 2;
  }
  return pdf.save();
}
