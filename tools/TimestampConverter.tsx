"use client";
import { useEffect, useState } from "react";

const rel = (ms: number) => { const s = Math.round((ms - Date.now()) / 1000), a = Math.abs(s), u: [string, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [n, v] of u) if (a >= v) { const c = Math.floor(a / v); return s < 0 ? `${c} ${n}${c > 1 ? "s" : ""} ago` : `in ${c} ${n}${c > 1 ? "s" : ""}`; } return "now"; };
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);

export default function TimestampConverter() {
  const [ts, setTs] = useState("");
  const [now, setNow] = useState(0);
  const [dt, setDt] = useState("");
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { setTs(String(Math.floor(Date.now() / 1000))); setDt(toLocalInput(new Date())); }, []);

  const n = Number(ts.trim()), ms = !ts.trim() || isNaN(n) ? NaN : Math.abs(n) > 1e11 ? n : n * 1000;     // 13 digits = milliseconds
  const d = new Date(ms), ok = !isNaN(d.getTime());
  const fromDt = dt ? new Date(dt) : null;
  const row = (k: string, v: string) => <div className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0"><span className="text-neutral-500">{k}</span><span className="font-mono break-all" data-k={k}>{v}</span></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 text-sm"><p className="text-neutral-500">Current Unix time</p><p className="font-mono text-2xl" data-testid="now">{now ? Math.floor(now / 1000) : "…"}</p></div>
      <section className="space-y-3">
        <h2 className="font-semibold">Timestamp to date</h2>
        <div className="flex gap-2"><input aria-label="Unix timestamp" className="input font-mono" value={ts} onChange={(e) => setTs(e.target.value)} placeholder="e.g. 1700000000 or 1700000000000" />
          <button className="btn-ghost" onClick={() => setTs(String(Math.floor(Date.now() / 1000)))}>Now</button></div>
        {ts && !ok && <p className="text-sm text-red-600">That is not a valid timestamp.</p>}
        {ok && <div className="rounded-xl border bg-white px-4 text-sm" data-testid="ts-out">{row("Your time zone", d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "medium" }))}{row("UTC", d.toUTCString())}{row("ISO 8601", d.toISOString())}{row("Relative", rel(d.getTime()))}{row("Seconds", String(Math.floor(d.getTime() / 1000)))}{row("Milliseconds", String(d.getTime()))}</div>}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Date to timestamp</h2>
        <input aria-label="Date and time" type="datetime-local" step={1} className="input" value={dt} onChange={(e) => setDt(e.target.value)} />
        {fromDt && !isNaN(fromDt.getTime()) && <div className="rounded-xl border bg-white px-4 text-sm" data-testid="dt-out">{row("Seconds", String(Math.floor(fromDt.getTime() / 1000)))}{row("Milliseconds", String(fromDt.getTime()))}{row("UTC", fromDt.toUTCString())}</div>}
        <p className="text-xs text-neutral-500">The date above is read in your own time zone.</p>
      </section>
    </div>
  );
}
