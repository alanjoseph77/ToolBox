"use client";
import { useState } from "react";
import writeXlsxFile from "write-excel-file/browser";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { openPdf, pageTextItems, toLines } from "@/lib/pdfjs";

/** Splits a line into cells wherever the horizontal gap is wider than a few characters. */
function toCells(line: { str: string; x: number; w: number; h: number }[]) {
  const cells: { text: string; x: number }[] = [];
  let end = -Infinity;
  for (const it of line) {
    if (cells.length && it.x - end < it.h * 0.9) cells[cells.length - 1].text += (it.x - end > it.h * 0.15 ? " " : "") + it.str;
    else cells.push({ text: it.str, x: it.x });
    end = it.x + it.w;
  }
  return cells;
}

export default function PdfToExcel() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (f: File) => {
    setBusy(true); setError("");
    try {
      const pdf = await openPdf(f);
      const sheets: { data: { value: string | number; type?: typeof String | typeof Number }[][]; sheet: string }[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        setStatus(`Reading page ${p} of ${pdf.numPages}…`);
        const rows = toLines(await pageTextItems(pdf, p)).map(toCells);
        // cluster cell x-positions into shared columns so values line up across rows
        const xs = rows.flat().map((c) => c.x).sort((a, b) => a - b), cols: number[] = [];
        for (const x of xs) if (!cols.length || x - cols[cols.length - 1] > 12) cols.push(x);
        const data = rows.map((r) => {
          const row: { value: string | number; type?: typeof String | typeof Number }[] = cols.map(() => ({ value: "" }));
          for (const c of r) {
            let ci = 0; for (let k = 0; k < cols.length; k++) if (Math.abs(cols[k] - c.x) <= Math.abs(cols[ci] - c.x)) ci = k;
            const num = /^-?[\d,]+(\.\d+)?$/.test(c.text.trim()) ? Number(c.text.replace(/,/g, "")) : NaN;
            row[ci] = isNaN(num) ? { value: row[ci].value ? row[ci].value + " " + c.text : c.text, type: String } : { value: num, type: Number };
          }
          return row;
        });
        if (data.length) sheets.push({ data, sheet: `Page ${p}` });
      }
      if (!sheets.length) { setError("No selectable text found. This looks like a scanned PDF. Use the PDF OCR tool instead."); setBusy(false); setStatus(""); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob: Blob = await (writeXlsxFile(sheets as any) as any).toBlob();
      download(blob, f.name.replace(/\.pdf$/i, "") + ".xlsx");
      setStatus("Done. Your Excel file was downloaded (one sheet per page).");
    } catch { setError("Could not convert this PDF. It may be encrypted or damaged."); setStatus(""); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && !busy && run(f[0])} />
      {status && <p className="text-sm text-slate-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">Works best on PDFs with simple tables (invoices, statements, reports). Text is aligned into columns by position.</p>
    </div>
  );
}
