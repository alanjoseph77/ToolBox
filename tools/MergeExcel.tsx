"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { readSheets, writeSheets, type Sheet } from "@/lib/xlsxIo";

interface Item { id: number; name: string; sheets: Sheet[] }
let counter = 0;

export default function MergeExcel() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"sheets" | "stack">("sheets");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const add = async (files: File[]) => {
    setError(""); setDone("");
    for (const f of files) {
      try { const sheets = await readSheets(f); setItems((p) => [...p, { id: ++counter, name: f.name, sheets }]); }
      catch (e) { setError(`${f.name}: ${(e as Error).message || "could not be read."}`); }
    }
  };
  const move = (i: number, d: number) => setItems((p) => { const j = i + d; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const merge = async () => {
    setBusy(true); setError(""); setDone("");
    try {
      let out: Sheet[];
      if (mode === "sheets") out = items.flatMap((it) => it.sheets.map((s) => ({ name: it.sheets.length === 1 ? it.name.replace(/\.[^.]+$/, "") : `${it.name.replace(/\.[^.]+$/, "")} ${s.name}`, rows: s.rows })));
      else {
        const rows: string[][] = []; let first = true;
        for (const it of items) for (const s of it.sheets) { rows.push(...(first ? s.rows : s.rows.slice(1))); first = false; } // the header row is kept once
        out = [{ name: "Merged", rows }];
      }
      await download(await writeSheets(out, { header: mode === "stack" }), "merged.xlsx");
      setDone(`Saved merged.xlsx with ${out.length} sheet${out.length === 1 ? "" : "s"} and ${out.reduce((n, s) => n + s.rows.length, 0)} rows.`);
    } catch { setError("Could not merge these files."); }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Dropzone accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv" multiple onFiles={add} hint="Add two or more Excel (.xlsx) or CSV files." />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {items.length > 0 && <ul className="divide-y rounded-xl border bg-white">{items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-2 p-3 text-sm"><span className="min-w-0 flex-1 truncate">{i + 1}. {it.name} <span className="text-neutral-500">({it.sheets.length} sheet{it.sheets.length === 1 ? "" : "s"}, {it.sheets.reduce((n, s) => n + s.rows.length, 0)} rows)</span></span>
          <button aria-label="Move up" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
          <button aria-label="Move down" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
          <button aria-label="Remove" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => setItems(items.filter((x) => x.id !== it.id))}><X className="h-4 w-4" /></button></li>))}</ul>}
      {items.length > 0 && <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="How to merge">
          <button aria-pressed={mode === "sheets"} className={mode === "sheets" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("sheets")}>One sheet per file</button>
          <button aria-pressed={mode === "stack"} className={mode === "stack" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("stack")}>Stack all rows in one sheet</button></div>
        <p className="text-xs text-neutral-500">{mode === "sheets" ? "Each file keeps its own sheet or sheets." : "Every sheet of every file is added one after another. The first row of the first sheet is the header, and the first row of each later sheet is skipped, so the columns should match."}</p>
        <button className="btn w-full" disabled={busy || items.length < 2} onClick={merge}>{`Merge ${items.length} files`}</button>
        {done && <p className="text-sm text-neutral-600" role="status" data-done="1">{done}</p>}
      </div>}
      <WaterLoader active={busy} label="Merging your spreadsheets…" />
      {items.length > 0 && <p className="text-xs text-neutral-500">Total size of the files you added: {formatBytes(items.reduce((n, i) => n + i.sheets.reduce((m, s) => m + s.rows.join().length, 0), 0))} of text. Values are kept, formulas and formatting are not.</p>}
    </div>
  );
}
