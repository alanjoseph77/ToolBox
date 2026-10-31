"use client";
import { useMemo, useState } from "react";
import Stat from "@/components/Stat";
import { inr } from "@/lib/calc";
import { fd } from "@/lib/finance";

export default function FdCalculator() {
  const [p, setP] = useState("100000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("5");
  const [n, setN] = useState("4");
  const r = useMemo(() => { try { return fd(+p, +rate || 0, +years || 0, +n); } catch { return null; } }, [p, rate, years, n]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="p">Deposit (₹)</label><input id="p" type="number" min={0} className="input" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div><label className="label" htmlFor="fr">Interest rate (% a year)</label><input id="fr" type="number" min={0} step="0.05" className="input" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div><label className="label" htmlFor="fy">Years</label><input id="fy" type="number" min={0} step="0.5" className="input" value={years} onChange={(e) => setYears(e.target.value)} /></div>
        <div><label className="label" htmlFor="fn">Interest added</label><select id="fn" className="input" value={n} onChange={(e) => setN(e.target.value)}><option value="12">Monthly</option><option value="4">Quarterly</option><option value="2">Half-yearly</option><option value="1">Yearly</option></select></div>
      </div>
      {r && <div className="grid grid-cols-3 gap-3"><Stat label="Deposit" value={inr(Math.round(r.invested))} id="invested" /><Stat label="Interest" value={inr(Math.round(r.interest))} id="interest" /><Stat label="Maturity value" value={inr(Math.round(r.maturity))} big id="maturity" /></div>}
      <p className="text-xs text-neutral-500">Banks differ in how they add interest and round it, so your bank&apos;s figure may be a little different. Tax on the interest is not included.</p>
    </div>
  );
}
