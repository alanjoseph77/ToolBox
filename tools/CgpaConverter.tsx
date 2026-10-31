"use client";
import { useState } from "react";
import Stat from "@/components/Stat";

export default function CgpaConverter() {
  const [cgpa, setCgpa] = useState("");
  const [pct, setPct] = useState("");
  const [factor, setFactor] = useState("9.5");
  const f = +factor || 9.5;
  const toPct = cgpa ? Math.round(+cgpa * f * 100) / 100 : null;
  const toCgpa = pct ? Math.round((+pct / f) * 100) / 100 : null;
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div><label className="label" htmlFor="fc">Multiplier</label>
          <div className="flex flex-wrap gap-2">{[["9.5", "CBSE and many universities (9.5)"], ["10", "Simple (10)"]].map(([k, l]) => <button key={k} className={factor === k ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setFactor(k)}>{l}</button>)}
            <input id="fc" type="number" step="0.01" aria-label="Multiplier" className="input !w-24" value={factor} onChange={(e) => setFactor(e.target.value)} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="cg">CGPA (out of 10)</label><input id="cg" type="number" min={0} max={10} step="0.01" className="input" value={cgpa} onChange={(e) => setCgpa(e.target.value)} /></div>
          <div><label className="label" htmlFor="pc">Percentage</label><input id="pc" type="number" min={0} max={100} step="0.01" className="input" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">{toPct !== null && <Stat label="Percentage" value={`${toPct}%`} big id="pct" />}{toCgpa !== null && <Stat label="CGPA" value={String(toCgpa)} big id="cgpa" />}</div>
      <p className="text-xs text-neutral-500">Your university sets its own conversion. Use the official formula on your marksheet or ask your institution if a form needs an exact figure.</p>
    </div>
  );
}
