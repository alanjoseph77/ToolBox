"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { gst, inr } from "@/lib/calc";

const rates = [0, 3, 5, 12, 18, 28];

export default function GstCalculator() {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState(18);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const r = custom.trim() ? +custom : rate;
  const res = (() => { try { return Number.isFinite(r) && r >= 0 ? gst(+amount || 0, r, mode) : null; } catch { return null; } })();
  const rows: [string, number][] = res ? [["Amount before GST", res.base], [`CGST (${r / 2}%)`, res.cgst], [`SGST (${r / 2}%)`, res.sgst], [`Total GST (${r}%)`, res.gst], ["Total amount", res.total]] : [];
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex gap-2">
          <button className={mode === "exclusive" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("exclusive")}>Add GST</button>
          <button className={mode === "inclusive" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("inclusive")}>Remove GST</button>
        </div>
        <div><label className="label">{mode === "exclusive" ? "Amount before GST (₹)" : "Amount including GST (₹)"}</label><input type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label className="label">GST rate</label>
          <div className="flex flex-wrap items-center gap-2">
            {rates.map((x) => <button key={x} className={!custom.trim() && rate === x ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => { setRate(x); setCustom(""); }}>{x}%</button>)}
            <input type="number" min={0} className="input !w-28" placeholder="Custom %" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom GST rate" />
          </div></div>
      </div>
      {res && (
        <div className="rounded-xl border bg-white">
          {rows.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between gap-3 p-3 ${i ? "border-t" : ""} ${i === rows.length - 1 ? "text-lg font-extrabold" : "text-sm"}`}>
              <span>{k}</span><span className="flex items-center gap-2">{inr(v, 2)}<CopyButton text={v.toFixed(2)} label="Copy" /></span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500">For intra-state sales GST splits equally into CGST and SGST. For inter-state sales the whole amount is IGST.</p>
    </div>
  );
}
