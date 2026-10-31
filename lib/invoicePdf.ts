import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { type InvoiceItem, invoiceTotals } from "./invoice";
import { rupeesInWords } from "./words";

export interface Party { name: string; address?: string; gstin?: string; phone?: string; email?: string }
export interface InvoiceData { title: string; number: string; date: string; seller: Party; buyer: Party; items: InvoiceItem[]; interState: boolean; discountPct?: number; notes?: string; upi?: string }

// Standard PDF fonts only cover Latin-1, so the rupee sign is written as "Rs." and other symbols become "?".
const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/₹/g, "Rs.").replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "?");
const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  for (const para of safe(text).split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const n = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(n, size) <= max) line = n; else { if (line) out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

/** A one-or-more page A4 GST invoice. */
export async function buildInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 40, ink = rgb(0.05, 0.05, 0.05), grey = rgb(0.4, 0.4, 0.4), line = rgb(0.8, 0.8, 0.8);
  const t = invoiceTotals(d.items, d.interState, d.discountPct ?? 0);
  let page: PDFPage = pdf.addPage([W, H]), y = H - M;
  const text = (s: string, x: number, yy: number, size = 10, f = reg, color = ink, align: "l" | "r" = "l") => {
    const v = safe(s), w = f.widthOfTextAtSize(v, size);
    page.drawText(v, { x: align === "r" ? x - w : x, y: yy, size, font: f, color });
  };
  const rule = (yy: number, x1 = M, x2 = W - M) => page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: 0.6, color: line });

  text(d.title || "INVOICE", M, y - 18, 22, bold); text(`No: ${d.number}`, W - M, y - 8, 10, reg, ink, "r"); text(`Date: ${d.date}`, W - M, y - 22, 10, reg, ink, "r");
  y -= 44; rule(y); y -= 18;

  const half = (W - 2 * M) / 2 - 10;
  const block = (label: string, p: Party, x: number) => {
    let yy = y; text(label, x, yy, 8, bold, grey); yy -= 14; text(p.name || "-", x, yy, 11, bold); yy -= 14;
    const rows = [...wrap(p.address ?? "", reg, 9, half), p.gstin ? `GSTIN: ${p.gstin}` : "", p.phone ? `Phone: ${p.phone}` : "", p.email ?? ""].filter(Boolean);
    for (const r of rows) { text(r, x, yy, 9, reg, grey); yy -= 12; }
    return yy;
  };
  y = Math.min(block("FROM", d.seller, M), block("BILL TO", d.buyer, M + half + 20)) - 8;

  const cols = d.interState ? [26, 190, 52, 40, 62, 40, 70] : [26, 190, 52, 40, 62, 40, 70];
  const xs: number[] = []; cols.reduce((a, c) => { xs.push(a); return a + c; }, M);
  const head = () => {
    page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 18, color: rgb(0.94, 0.94, 0.94) });
    ["#", "Description", "HSN/SAC", "Qty", "Rate", "GST %", "Amount"].forEach((h, i) => text(h, i >= 3 ? xs[i] + cols[i] - 4 : xs[i] + 3, y, 8.5, bold, ink, i >= 3 ? "r" : "l"));
    y -= 20;
  };
  head();
  t.lines.forEach((l, i) => {
    const desc = wrap(l.desc, reg, 9, cols[1] - 8), h = Math.max(1, desc.length) * 12 + 4;
    if (y - h < M + 150) { page = pdf.addPage([W, H]); y = H - M; head(); }
    text(String(i + 1), xs[0] + 3, y, 9);
    desc.forEach((r, k) => text(r, xs[1] + 3, y - k * 12, 9));
    text(l.hsn ?? "", xs[2] + 3, y, 9); text(String(l.qty), xs[3] + cols[3] - 4, y, 9, reg, ink, "r");
    text(money(l.rate), xs[4] + cols[4] - 4, y, 9, reg, ink, "r"); text(`${l.gstPct}%`, xs[5] + cols[5] - 4, y, 9, reg, ink, "r"); text(money(l.amount), xs[6] + cols[6] - 4, y, 9, reg, ink, "r");
    y -= h; rule(y + 6);
  });

  if (y < M + 170) { page = pdf.addPage([W, H]); y = H - M; }
  y -= 10;
  const right = W - M, lab = right - 130;
  const row = (label: string, v: string, f = reg, size = 10) => { text(label, lab, y, size, f, grey); text(v, right, y, size, f, ink, "r"); y -= 15; };
  row("Subtotal", money(t.subtotal));
  if (d.discountPct) row(`Discount ${d.discountPct}% applied`, "");
  if (d.interState) row("IGST", money(t.igst)); else { row("CGST", money(t.cgst)); row("SGST", money(t.sgst)); }
  if (t.roundOff) row("Round off", (t.roundOff > 0 ? "+" : "") + money(t.roundOff));
  rule(y + 8, lab, right); y -= 4;
  row("Total (Rs.)", money(t.total), bold, 12); y -= 6;
  const words = wrap(rupeesInWords(t.total), bold, 9, W - 2 * M);
  words.forEach((w) => { text(w, M, y, 9, bold); y -= 12; });
  y -= 8;
  if (d.upi) { text(`Pay by UPI: ${d.upi}`, M, y, 9, reg, grey); y -= 14; }
  if (d.notes?.trim()) { text("Notes", M, y, 8, bold, grey); y -= 12; wrap(d.notes, reg, 9, W - 2 * M).forEach((n) => { text(n, M, y, 9, reg, grey); y -= 12; }); }
  text("This is a computer generated invoice.", M, M - 10, 8, reg, grey);
  return pdf.save();
}
