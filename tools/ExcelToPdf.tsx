"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { tablesToPdf } from "@/lib/tablePdf";
import { readSheets, type Sheet } from "@/lib/xlsxIo";

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [pick, setPick] = useState<Set<number>>(new Set());
  const [header, setHeader] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  const load = async (f: File[]) => {
    if (!f[0]) return; setBusy(true); setError(""); setOut(null);
    try { const s = await readSheets(f[0]); if (!s.length) throw new Error("This file has no sheets."); setFile(f[0]); setSheets(s); setPick(new Set(s.map((_, i) => i))); }
    catch (e) { setError((e as Error).message || "Could not read this file."); setSheets([]); }
    setBusy(false);
  };
  const make = async () => {
    setBusy(true); setError("");
    try {
      const chosen = sheets.filter((_, i) => pick.has(i));
      const bytes = await tablesToPdf(chosen.map((s) => ({ name: s.name, rows: s.rows })), { header });
      setOut({ bytes, pages: (await PDFDocument.load(bytes)).getPageCount() });
    } catch { setError("Could not make the PDF from this file."); }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Dropzone accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv" onFiles={load} hint="Add an Excel (.xlsx) or CSV file. It stays on your device." />
      <WaterLoader active={busy} label="Working on your spreadsheet…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {file && sheets.length > 0 && !busy && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{file.name} · {sheets.length} sheet{sheets.length === 1 ? "" : "s"}</p>
          <div className="space-y-1">{sheets.map((s, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pick.has(i)} onChange={(e) => setPick((p) => { const n = new Set(p); e.target.checked ? n.add(i) : n.delete(i); return n; })} /> {s.name} <span className="text-neutral-500">({s.rows.length} rows)</span></label>)}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row is a header (repeat it on every page)</label>
          <button className="btn w-full" disabled={!pick.size} onClick={make}>Convert to PDF</button>
          {out && <div className="space-y-2 border-t pt-3"><p className="text-sm" data-done="1">PDF ready: {out.pages} page{out.pages === 1 ? "" : "s"} · {formatBytes(out.bytes.length)}</p>
            <button className="btn w-full" onClick={() => download(out.bytes, file.name.replace(/\.[^.]+$/, "") + ".pdf", "application/pdf")}>Download PDF</button></div>}
        </div>
      )}
      <p className="text-xs text-neutral-500">This draws the values as a clean table. It does not keep Excel colours, fonts, merged cells, charts or images. Wide tables are set in landscape.</p>
    </div>
  );
}
