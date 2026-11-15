"use client";
import { useMemo, useState } from "react";
import { explain, nextRuns, parseCron } from "@/lib/cron";

const EXAMPLES: [string, string][] = [["Every minute", "* * * * *"], ["Every 5 minutes", "*/5 * * * *"], ["Every day at 9:30", "30 9 * * *"], ["Weekdays at 8:00", "0 8 * * 1-5"], ["Every Monday at 6:00", "0 6 * * 1"], ["1st of the month, midnight", "0 0 1 * *"]];

export default function CronHelper() {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const r = useMemo(() => { try { const c = parseCron(expr); return { text: explain(c), runs: nextRuns(c, new Date(), 6), err: "" }; } catch (e) { return { text: "", runs: [], err: (e as Error).message }; } }, [expr]);

  return (
    <div className="space-y-4">
      <div><label className="label" htmlFor="cron">Cron expression</label><input id="cron" className="input font-mono text-lg" value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} />
        <p className="mt-1 text-xs text-neutral-500 font-mono">minute · hour · day of month · month · day of week</p></div>
      {r.err ? <p className="text-sm text-red-600" role="alert">{r.err}</p> : (
        <>
          <p className="rounded-xl border bg-white p-4 text-lg" data-testid="cron-text">{r.text}</p>
          <div className="rounded-xl border bg-white p-4 text-sm"><p className="mb-2 font-medium">Next runs (your time zone)</p>
            <ul className="space-y-1 font-mono" data-testid="cron-runs">{r.runs.map((d, i) => <li key={i}>{d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</li>)}</ul>
            {r.runs.length === 0 && <p className="text-neutral-500">This schedule never runs in the next few years.</p>}</div>
        </>
      )}
      <div><p className="mb-2 text-sm font-medium">Examples</p><div className="flex flex-wrap gap-2">{EXAMPLES.map(([l, e]) => <button key={e} className="btn-ghost !py-1.5" onClick={() => setExpr(e)}>{l}</button>)}</div></div>
    </div>
  );
}
