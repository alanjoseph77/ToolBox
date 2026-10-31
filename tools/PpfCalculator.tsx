"use client";
import { useMemo, useState } from "react";
import Stat from "@/components/Stat";
import { inr } from "@/lib/calc";
import { ppf } from "@/lib/finance";

export default function PpfCalculator() {
  const [d, setD] = useState("150000");
  const [rate, setRate] = useState("7.1");
  const [years, setYears] = useState("15");
  const r = useMemo(() => { try { return ppf(Math.min(150000, +d || 0), +rate || 0, Math.max(1, Math.round(+years || 15))); } catch { return null; } }, [d, rate, years]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="d">Yearly deposit (₹, up to 1,50,000)</label><input id="d" type="number" min={0} max={150000} className="input" value={d} onChange={(e) => setD(e.target.value)} /></div>
        <div><label className="label" htmlFor="pr">Interest rate (% a year)</label><input id="pr" type="number" min={0} step="0.1" className="input" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div><label className="label" htmlFor="py">Years</label><input id="py" type="number" min={1} className="input" value={years} onChange={(e) => setYears(e.target.value)} /></div>
      </div>
      {r && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat label="Invested" value={inr(Math.round(r.invested))} id="invested" /><Stat label="Interest" value={inr(Math.round(r.interest))} id="interest" /><Stat label="Maturity value" value={inr(Math.round(r.maturity))} big id="maturity" /></div>
        <details className="rounded-xl border bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Year by year</summary>
          <table className="mt-3 w-full text-right tabular-nums"><thead><tr className="text-neutral-500"><th className="text-left">Year</th><th>Interest</th><th>Balance</th></tr></thead>
            <tbody>{r.rows.map((x) => <tr key={x.year}><td className="text-left">{x.year}</td><td>{inr(Math.round(x.interest))}</td><td>{inr(Math.round(x.balance))}</td></tr>)}</tbody></table></details>
      </>}
      <p className="text-xs text-neutral-500">Assumes the deposit is made before the 5th of April each year and the rate stays the same. The government changes the PPF rate every quarter, so check the current rate.</p>
    </div>
  );
}
