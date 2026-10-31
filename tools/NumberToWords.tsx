"use client";
import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { intToWords, rupeesInWords } from "@/lib/words";

export default function NumberToWords() {
  const [v, setV] = useState("");
  const [mode, setMode] = useState<"rupees" | "indian" | "international">("rupees");
  const out = useMemo(() => {
    const clean = v.replace(/,/g, "").trim();
    if (!clean) return { text: "", error: "" };
    if (!/^\d+(\.\d{1,2})?$/.test(clean)) return { text: "", error: "Enter digits only, with up to 2 decimal places." };
    try { return { text: mode === "rupees" ? rupeesInWords(+clean) : intToWords(Math.floor(+clean), mode), error: "" }; } catch (e) { return { text: "", error: (e as Error).message }; }
  }, [v, mode]);
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div><label className="label" htmlFor="nv">Number or amount</label><input id="nv" inputMode="decimal" className="input" placeholder="12,34,567.50" value={v} onChange={(e) => setV(e.target.value)} /></div>
        <div className="flex flex-wrap gap-2">
          {([["rupees", "Rupees (cheque)"], ["indian", "Indian (lakh, crore)"], ["international", "International (million)"]] as const).map(([k, l]) => <button key={k} className={mode === k ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode(k)}>{l}</button>)}
        </div>
      </div>
      {out.error && <p className="text-sm text-red-600">{out.error}</p>}
      {out.text && <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-lg font-semibold" data-words="1">{out.text}</p><CopyButton text={out.text} /></div>}
    </div>
  );
}
