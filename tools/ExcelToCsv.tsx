"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { PartsList, type Part } from "@/components/PdfShell";
import { toCsv } from "@/lib/csv";
import { readSheets, sheetNames, type Sheet } from "@/lib/xlsxIo";

export default function ExcelToCsv() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [name, setName] = useState("workbook");
  const [delim, setDelim] = useState(",");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (f: File[]) => {
    if (!f[0]) return; setBusy(true); setError(""); setSheets([]); setName(f[0].name.replace(/\.[^.]+$/, ""));
    try { const s = await readSheets(f[0]); if (!s.length) throw new Error("This file has no sheets."); setSheets(s); }
    catch (e) { setError((e as Error).message || "Could not read this file. Is it a valid .xlsx file?"); }
    setBusy(false);
  };
  const ext = delim === "\t" ? "tsv" : "csv";
  const names = sheetNames(sheets.map((s) => s.name));
  const parts: Part[] = sheets.map((s, i) => ({ name: sheets.length === 1 ? `${name}.${ext}` : `${name}-${names[i]}.${ext}`, bytes: new TextEncoder().encode("﻿" + toCsv(s.rows, delim)), type: "text/csv" }));

  return (
    <div className="space-y-4">
      <Dropzone accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv" onFiles={load} hint="Add an Excel (.xlsx) file. Each sheet becomes its own CSV." />
      <WaterLoader active={busy} label="Reading your spreadsheet…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {sheets.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-4 text-sm"><label className="flex items-center gap-2">Separator <select aria-label="Separator" className="input !w-36" value={delim} onChange={(e) => setDelim(e.target.value)}><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab (TSV)</option></select></label>
            <p className="mt-2 text-neutral-600" data-sheets="1">{sheets.map((s, i) => `${names[i]}: ${s.rows.length} rows`).join(" · ")}</p></div>
          <PartsList parts={parts} zipName={`${name}-csv.zip`} />
        </div>
      )}
      <p className="text-xs text-neutral-500">You get the values Excel shows, not formulas. Dates are written as yyyy-mm-dd. The file is saved as UTF-8 so Hindi, Malayalam and other scripts stay intact.</p>
    </div>
  );
}
