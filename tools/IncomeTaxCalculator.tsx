"use client";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import Stat from "@/components/Stat";
import { inr } from "@/lib/calc";
import { incomeTax, type AgeGroup, type Regime } from "@/lib/finance";

export default function IncomeTaxCalculator() {
  const [income, setIncome] = useState("1500000");
  const [regime, setRegime] = useState<Regime>("new");
  const [ded, setDed] = useState("150000");
  const [age, setAge] = useState<AgeGroup>("below60");
  const [salaried, setSalaried] = useState(true);
  const r = useMemo(() => { try { return incomeTax({ income: +income || 0, regime, deductions: +ded || 0, age, salaried }); } catch { return null; } }, [income, regime, ded, age, salaried]);
  const other = useMemo(() => { try { return incomeTax({ income: +income || 0, regime: regime === "new" ? "old" : "new", deductions: +ded || 0, age, salaried }); } catch { return null; } }, [income, regime, ded, age, salaried]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="inc">Yearly income (₹)</label><input id="inc" type="number" min={0} className="input" value={income} onChange={(e) => setIncome(e.target.value)} /></div>
        <div><label className="label" htmlFor="reg">Tax regime</label><select id="reg" className="input" value={regime} onChange={(e) => setRegime(e.target.value as Regime)}><option value="new">New regime</option><option value="old">Old regime</option></select></div>
        {regime === "old" && <>
          <div><label className="label" htmlFor="ded">Deductions: 80C, 80D, HRA etc. (₹)</label><input id="ded" type="number" min={0} className="input" value={ded} onChange={(e) => setDed(e.target.value)} /></div>
          <div><label className="label" htmlFor="age">Age</label><select id="age" className="input" value={age} onChange={(e) => setAge(e.target.value as AgeGroup)}><option value="below60">Below 60</option><option value="senior">60 to 79</option><option value="super">80 and above</option></select></div>
        </>}
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={salaried} onChange={(e) => setSalaried(e.target.checked)} /> Salaried or pensioner (standard deduction applies)</label>
      </div>
      {r && <>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total tax a year" value={inr(Math.round(r.total))} big id="total" />
          <Stat label="Per month" value={inr(Math.round(r.monthly))} big id="monthly" />
          <Stat label="Taxable income" value={inr(Math.round(r.taxable))} id="taxable" />
          <Stat label="Effective rate" value={`${r.effectivePct.toFixed(1)}%`} id="effective" />
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="mb-2 font-semibold">How it adds up</p>
          <dl className="space-y-1">
            {([["Tax on slabs", r.slabTax], ["Rebate (section 87A and relief)", -r.rebate], ["Surcharge", r.surcharge], ["Health and education cess (4%)", r.cess]] as [string, number][]).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-neutral-600">{k}</dt><dd className="tabular-nums">{v < 0 ? "−" : ""}{inr(Math.round(Math.abs(v)))}</dd></div>)}
          </dl>
          {other && <p className="mt-3 border-t pt-3 text-neutral-600" data-compare="1">For comparison, the {regime === "new" ? "old" : "new"} regime would be about <b>{inr(Math.round(other.total))}</b>{regime === "new" ? " with the deductions above" : ""}.</p>}
        </div>
      </>}
      <p className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> An estimate using the slabs for FY 2025-26 (AY 2026-27). It does not cover capital gains, other special rates or surcharge relief, and the rules change every Budget. Check with the Income Tax department or a tax professional before you file.</p>
    </div>
  );
}
