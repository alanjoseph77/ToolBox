"use client";
import { useMemo, useState } from "react";
import Stat from "@/components/Stat";
import { inr, sip } from "@/lib/calc";

export default function SipCalculator() {
  const [m, setM] = useState("10000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("15");
  const r = useMemo(() => { try { return sip(+m, +rate || 0, +years || 0); } catch { return null; } }, [m, rate, years]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="m">Monthly investment (₹)</label><input id="m" type="number" min={0} className="input" value={m} onChange={(e) => setM(e.target.value)} /></div>
        <div><label className="label" htmlFor="r">Expected return (% a year)</label><input id="r" type="number" min={0} step="0.1" className="input" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div><label className="label" htmlFor="y">Years</label><input id="y" type="number" min={1} className="input" value={years} onChange={(e) => setYears(e.target.value)} /></div>
      </div>
      {r && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat label="Invested" value={inr(Math.round(r.invested))} id="invested" /><Stat label="Returns" value={inr(Math.round(r.returns))} id="returns" /><Stat label="Total value" value={inr(Math.round(r.futureValue))} big id="value" /></div>}
      <p className="text-xs text-neutral-500">Assumes a steady return, with each instalment invested at the start of the month. Real market returns vary and are not guaranteed.</p>
    </div>
  );
}
