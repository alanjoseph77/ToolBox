"use client";
import { useMemo, useState } from "react";
import { amortization, emi, inr } from "@/lib/calc";

export default function EmiCalculator() {
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [all, setAll] = useState(false);

  const months = Math.round((+tenure || 0) * (unit === "years" ? 12 : 1));
  const res = useMemo(() => { try { return emi(+amount, +rate || 0, months); } catch { return null; } }, [amount, rate, months]);
  const rows = useMemo(() => (res ? amortization(+amount, +rate || 0, months) : []), [res, amount, rate, months]);
  const interestShare = res ? Math.round((res.totalInterest / res.totalPayment) * 100) : 0;
  const yearly = useMemo(() => {
    const out: { year: number; principal: number; interest: number; balance: number }[] = [];
    rows.forEach((r) => { const y = Math.ceil(r.month / 12); const o = out[y - 1] ?? (out[y - 1] = { year: y, principal: 0, interest: 0, balance: 0 }); o.principal += r.principal; o.interest += r.interest; o.balance = r.balance; });
    return out;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3">
        <div><label className="label">Loan amount (₹)</label><input type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-1">{[100000, 500000, 1000000, 5000000].map((v) => <button key={v} className="btn-ghost !min-h-0 !px-2 !py-1 text-xs" onClick={() => setAmount(String(v))}>{inr(v)}</button>)}</div></div>
        <div><label className="label">Interest rate (% a year)</label><input type="number" min={0} step="0.05" className="input" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div><label className="label">Tenure</label>
          <div className="flex gap-2"><input type="number" min={1} className="input" value={tenure} onChange={(e) => setTenure(e.target.value)} />
            <select className="input !w-28" value={unit} onChange={(e) => setUnit(e.target.value as "years" | "months")}><option>years</option><option>months</option></select></div></div>
      </div>

      {res ? (
        <>
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="label">Your monthly EMI</p>
            <p className="text-4xl font-extrabold tracking-tight" aria-live="polite">{inr(res.emi)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Principal", inr(+amount)], ["Total interest", inr(res.totalInterest)], ["Total payment", inr(res.totalPayment)]].map(([k, v]) => (
              <div key={k} className="rounded-xl border bg-white p-3"><p className="text-xs text-neutral-500">{k}</p><p className="text-lg font-bold">{v}</p></div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex justify-between text-xs text-neutral-500"><span>Principal {100 - interestShare}%</span><span>Interest {interestShare}%</span></div>
            <div className="flex h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800" role="img" aria-label={`Interest is ${interestShare}% of everything you pay`}>
              <div className="bg-neutral-900 dark:bg-white" style={{ width: `${100 - interestShare}%` }} />
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-neutral-500"><tr><th className="p-3">{all ? "Month" : "Year"}</th><th className="p-3">Principal</th><th className="p-3">Interest</th><th className="p-3">Balance</th></tr></thead>
              <tbody>
                {(all ? rows.map((r) => ({ k: r.month, principal: r.principal, interest: r.interest, balance: r.balance })) : yearly.map((y) => ({ k: y.year, ...y }))).map((r) => (
                  <tr key={r.k} className="border-t"><td className="p-3">{r.k}</td><td className="p-3">{inr(r.principal)}</td><td className="p-3">{inr(r.interest)}</td><td className="p-3">{inr(r.balance)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-ghost w-full" onClick={() => setAll(!all)}>{all ? "Show yearly summary" : "Show month-by-month schedule"}</button>
        </>
      ) : <p className="text-sm text-neutral-500">Enter a loan amount, rate and tenure to see your EMI.</p>}
      <p className="text-xs text-neutral-500">Reducing-balance method, as used by most banks. Actual EMIs may differ slightly because of processing fees and rounding.</p>
    </div>
  );
}
