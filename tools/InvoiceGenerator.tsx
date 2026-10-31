"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { download } from "@/lib/files";
import { inr } from "@/lib/calc";
import { invoiceTotals, type InvoiceItem } from "@/lib/invoice";
import { buildInvoicePdf, type Party } from "@/lib/invoicePdf";

const KEY = "toolbox:invoice-seller";
const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const blank = (): InvoiceItem => ({ desc: "", hsn: "", qty: 1, rate: 0, gstPct: 18 });

export default function InvoiceGenerator() {
  const [seller, setSeller] = useState<Party>({ name: "", address: "", gstin: "", phone: "", email: "" });
  const [buyer, setBuyer] = useState<Party>({ name: "", address: "", gstin: "" });
  const [number, setNumber] = useState("INV-001");
  const [date, setDate] = useState(today);
  const [gstInvoice, setGstInvoice] = useState(true);
  const [interState, setInterState] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [upi, setUpi] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([blank()]);
  const [error, setError] = useState("");

  useEffect(() => { try { const s = localStorage.getItem(KEY); if (s) setSeller((x) => ({ ...x, ...JSON.parse(s) })); } catch { /* storage unavailable */ } }, []);
  const saveSeller = (s: Party) => { setSeller(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } };

  const effective = useMemo(() => items.map((i) => (gstInvoice ? i : { ...i, gstPct: 0 })), [items, gstInvoice]);
  const t = useMemo(() => invoiceTotals(effective, interState, +discount || 0), [effective, interState, discount]);
  const setItem = (k: number, patch: Partial<InvoiceItem>) => setItems((p) => p.map((x, i) => (i === k ? { ...x, ...patch } : x)));

  const make = async () => {
    setError("");
    if (!seller.name.trim()) return setError("Enter your business name.");
    if (!buyer.name.trim()) return setError("Enter the customer name.");
    if (!t.lines.length) return setError("Add at least one item.");
    const bytes = await buildInvoicePdf({ title: gstInvoice ? "TAX INVOICE" : "INVOICE", number, date, seller, buyer, items: effective, interState, discountPct: +discount || 0, notes, upi: upi.trim() || undefined });
    download(bytes, `${number.replace(/[^\w.-]+/g, "-") || "invoice"}.pdf`, "application/pdf");
  };

  const party = (label: string, p: Party, set: (p: Party) => void, full: boolean) => (
    <div className="space-y-2 rounded-xl border bg-white p-4">
      <p className="text-sm font-semibold">{label}</p>
      <input className="input" aria-label={`${label} name`} placeholder="Name" value={p.name} onChange={(e) => set({ ...p, name: e.target.value })} />
      <textarea className="input h-20" aria-label={`${label} address`} placeholder="Address" value={p.address} onChange={(e) => set({ ...p, address: e.target.value })} />
      {gstInvoice && <input className="input" aria-label={`${label} GSTIN`} placeholder="GSTIN (optional)" value={p.gstin} onChange={(e) => set({ ...p, gstin: e.target.value.toUpperCase() })} />}
      {full && <div className="grid grid-cols-2 gap-2"><input className="input" aria-label={`${label} phone`} placeholder="Phone" value={p.phone} onChange={(e) => set({ ...p, phone: e.target.value })} /><input className="input" aria-label={`${label} email`} placeholder="Email" value={p.email} onChange={(e) => set({ ...p, email: e.target.value })} /></div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4">
        <div><label className="label" htmlFor="in">Invoice no.</label><input id="in" className="input" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
        <div><label className="label" htmlFor="id">Date</label><input id="id" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={gstInvoice} onChange={(e) => setGstInvoice(e.target.checked)} /> GST invoice</label>
        {gstInvoice && <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} /> Different state (IGST)</label>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{party("Your business", seller, saveSeller, true)}{party("Customer", buyer, setBuyer, false)}</div>

      <div className="space-y-3 rounded-xl border bg-white p-4">
        <p className="text-sm font-semibold">Items</p>
        {items.map((it, k) => (
          <div key={k} className="grid grid-cols-6 gap-2 border-b pb-3 last:border-0" data-item={k}>
            <input className="input col-span-6 sm:col-span-3" aria-label={`Item ${k + 1} description`} placeholder="Description" value={it.desc} onChange={(e) => setItem(k, { desc: e.target.value })} />
            {gstInvoice && <input className="input col-span-3 sm:col-span-1" aria-label={`Item ${k + 1} HSN`} placeholder="HSN/SAC" value={it.hsn} onChange={(e) => setItem(k, { hsn: e.target.value })} />}
            <input type="number" min={0} className="input col-span-2 sm:col-span-1" aria-label={`Item ${k + 1} quantity`} placeholder="Qty" value={it.qty} onChange={(e) => setItem(k, { qty: +e.target.value })} />
            <input type="number" min={0} className="input col-span-2 sm:col-span-1" aria-label={`Item ${k + 1} rate`} placeholder="Rate" value={it.rate || ""} onChange={(e) => setItem(k, { rate: +e.target.value })} />
            {gstInvoice && <select className="input col-span-2 sm:col-span-1" aria-label={`Item ${k + 1} GST`} value={it.gstPct} onChange={(e) => setItem(k, { gstPct: +e.target.value })}>{[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}% GST</option>)}</select>}
            <button aria-label={`Remove item ${k + 1}`} className="btn-ghost !min-h-0 !px-2 !py-1 justify-self-end" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== k))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button className="btn-ghost" onClick={() => setItems([...items, blank()])}><Plus className="h-4 w-4" /> Add item</button>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label" htmlFor="disc">Discount (%)</label><input id="disc" type="number" min={0} max={100} className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="upi">UPI ID to show on the invoice (optional)</label><input id="upi" className="input" placeholder="name@okbank" value={upi} onChange={(e) => setUpi(e.target.value)} /></div>
        </div>
        <div><label className="label" htmlFor="notes">Notes (optional)</label><textarea id="notes" className="input h-16" placeholder="Payment terms, bank details, thank you…" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm" data-totals="1">
        <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span>{inr(t.subtotal, 2)}</span></div>
        {gstInvoice && (interState ? <div className="flex justify-between"><span className="text-neutral-600">IGST</span><span>{inr(t.igst, 2)}</span></div> : <><div className="flex justify-between"><span className="text-neutral-600">CGST</span><span>{inr(t.cgst, 2)}</span></div><div className="flex justify-between"><span className="text-neutral-600">SGST</span><span>{inr(t.sgst, 2)}</span></div></>)}
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-extrabold"><span>Total</span><span data-total="1">{inr(t.total)}</span></div>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button className="btn w-full" onClick={make}>Download invoice PDF</button>
      <p className="text-xs text-neutral-500">Your business details are remembered in this browser only. Nothing is uploaded. Check the figures and your GST rules before sending an invoice, since this tool does not give tax advice. The PDF writes the rupee sign as &quot;Rs.&quot;.</p>
    </div>
  );
}
