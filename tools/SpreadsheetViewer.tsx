"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { toCsv } from "@/lib/csv";
import { download } from "@/lib/files";
import { readSheets, type Sheet } from "@/lib/xlsxIo";

const SHOW = 300;

export default function SpreadsheetViewer() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [name, setName] = useState("data");
  const [cur, setCur] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (f: File[]) => {
    if (!f[0]) return; setBusy(true); setError(""); setSheets([]); setCur(0); setQ(""); setSort(null); setName(f[0].name.replace(/\.[^.]+$/, ""));
    try { const s = await readSheets(f[0]); if (!s.length) throw new Error("This file has no sheets."); setSheets(s); } catch (e) { setError((e as Error).message || "Could not read this file."); }
    setBusy(false);
  };
  const sheet = sheets[cur];
  const view = useMemo(() => {
    if (!sheet) return { head: [] as string[], rows: [] as string[][] };
    const [head = [], ...body] = sheet.rows;
    let rows = q.trim() ? body.filter((r) => r.some((c) => c.toLowerCase().includes(q.trim().toLowerCase()))) : body;
    if (sort) rows = [...rows].sort((a, b) => { const x = a[sort.col] ?? "", y = b[sort.col] ?? "", nx = Number(x), ny = Number(y); return (x !== "" && y !== "" && !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y, undefined, { numeric: true })) * sort.dir; });
    return { head, rows };
  }, [sheet, q, sort]);
  const cols = sheet ? Math.max(...sheet.rows.map((r) => r.length), 0) : 0;
  const toggle = (c: number) => setSort((s) => (s?.col === c ? (s.dir === 1 ? { col: c, dir: -1 } : null) : { col: c, dir: 1 }));

  return (
    <div className="space-y-4">
      <Dropzone accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,.tsv,text/csv" onFiles={load} hint="Add an Excel (.xlsx) or CSV file to look at it as a table. It stays on your device." />
      <WaterLoader active={busy} label="Reading your spreadsheet…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {sheet && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          {sheets.length > 1 && <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sheets">{sheets.map((s, i) => <button key={i} role="tab" aria-selected={i === cur} className={i === cur ? "btn !py-1" : "btn-ghost !py-1"} onClick={() => { setCur(i); setSort(null); }}>{s.name}</button>)}</div>}
          <div className="flex flex-wrap items-center gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input aria-label="Search rows" className="input !pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button className="btn-ghost" onClick={() => download(new Blob(["﻿" + toCsv([view.head, ...view.rows])], { type: "text/csv" }), `${name}${q ? "-filtered" : ""}.csv`, "text/csv")}>Download CSV</button></div>
          <p className="text-sm text-neutral-600" data-count="1">{view.rows.length} row{view.rows.length === 1 ? "" : "s"}{q ? " match" : ""} · {cols} column{cols === 1 ? "" : "s"}{view.rows.length > SHOW ? ` · showing the first ${SHOW}` : ""}</p>
          <div className="max-h-[28rem] overflow-auto rounded-lg border">
            <table className="w-full border-collapse text-left text-sm" data-table="1">
              <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-900"><tr>{Array.from({ length: cols }, (_, c) => <th key={c} className="cursor-pointer whitespace-nowrap border-b px-3 py-2 font-semibold" onClick={() => toggle(c)} aria-sort={sort?.col === c ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>{view.head[c] || `Column ${c + 1}`}{sort?.col === c && (sort.dir === 1 ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />)}</th>)}</tr></thead>
              <tbody>{view.rows.slice(0, SHOW).map((r, i) => <tr key={i} className="odd:bg-white even:bg-neutral-50 dark:odd:bg-black dark:even:bg-neutral-950">{Array.from({ length: cols }, (_, c) => <td key={c} className="max-w-xs truncate border-b px-3 py-1.5" title={r[c]}>{r[c] ?? ""}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-500">Click a column title to sort. The first row is shown as the header. Values only: formulas and formatting are not shown.</p>
    </div>
  );
}
