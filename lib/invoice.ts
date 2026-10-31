export interface InvoiceItem { desc: string; hsn?: string; qty: number; rate: number; gstPct: number }
export interface InvoiceLine extends InvoiceItem { amount: number; gst: number }
export interface InvoiceTotals { lines: InvoiceLine[]; subtotal: number; cgst: number; sgst: number; igst: number; gstTotal: number; roundOff: number; total: number }

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Totals for a GST invoice. Inside one state the tax is split into CGST and SGST; between states it is IGST. */
export function invoiceTotals(items: InvoiceItem[], interState: boolean, discountPct = 0): InvoiceTotals {
  const lines = items.filter((i) => i.desc.trim() || i.qty * i.rate).map((i) => {
    const amount = r2(i.qty * i.rate * (1 - discountPct / 100));
    return { ...i, amount, gst: r2(amount * (i.gstPct / 100)) };
  });
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0)), gstTotal = r2(lines.reduce((s, l) => s + l.gst, 0));
  const cgst = interState ? 0 : r2(gstTotal / 2), sgst = interState ? 0 : r2(gstTotal - cgst), igst = interState ? gstTotal : 0;
  const exact = subtotal + gstTotal, total = Math.round(exact);
  return { lines, subtotal, cgst, sgst, igst, gstTotal, roundOff: r2(total - exact), total };
}
