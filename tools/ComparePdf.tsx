"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { diffLines, sideBySide } from "@/lib/diff";
import { openPdf, pageTextItems, toLines } from "@/lib/pdfjs";

interface Doc { name: string; lines: string[] }

async function readLines(file: File): Promise<Doc> {
  const pdf = await openPdf(file), lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++)
    toLines(await pageTextItems(pdf, p)).forEach((l) => { const t = l.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim(); if (t) lines.push(t); });
  return { name: file.name, lines };
}

export default function ComparePdf() {
  const [a, setA] = useState<Doc | null>(null);
  const [b, setB] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [onlyChanges, setOnlyChanges] = useState(true);

  const pick = (set: (d: Doc) => void) => async (files: File[]) => {
    if (!files[0]) return;
    setBusy(true); setError("");
    try { set(await readLines(files[0])); } catch { setError("Could not read that PDF."); }
    setBusy(false);
  };

  const ops = a && b ? diffLines(a.lines, b.lines) : null;
  const rows = ops ? sideBySide(ops) : [];
  const changed = rows.filter((r) => r.changed);
  const empty = (a && !a.lines.length) || (b && !b.lines.length);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="mb-1 text-sm font-semibold">Original PDF {a && <span className="font-normal text-neutral-500">· {a.name}</span>}</p><Dropzone accept="application/pdf" onFiles={pick(setA)} hint="The older version." /></div>
        <div><p className="mb-1 text-sm font-semibold">New PDF {b && <span className="font-normal text-neutral-500">· {b.name}</span>}</p><Dropzone accept="application/pdf" onFiles={pick(setB)} hint="The newer version." /></div>
      </div>
      <WaterLoader active={busy} label="Reading your PDF…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {empty && <p className="text-sm text-red-600">One of the PDFs has no selectable text (it may be a scan). Run it through PDF OCR first.</p>}
      {a && b && !empty && ops === null && <p className="text-sm text-red-600">These documents are too large to compare line by line here. Try fewer pages.</p>}
      {a && b && ops && !empty && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold" role="status">{changed.length ? `${ops.filter((o) => o.type === "del").length} lines removed, ${ops.filter((o) => o.type === "add").length} lines added` : "The two PDFs have identical text."}</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} /> Show only the differences</label>
          <div className="overflow-hidden rounded-lg border text-sm" data-diff="1">
            <div className="grid grid-cols-2 border-b bg-neutral-50 px-2 py-1 text-xs font-semibold"><span>Original</span><span>New</span></div>
            {(onlyChanges ? changed : rows).slice(0, 1500).map((r, i) => (
              <div key={i} className="grid grid-cols-2 border-b last:border-0">
                <p data-side="left" className={`whitespace-pre-wrap break-words p-2 ${r.changed && r.left !== undefined ? "bg-red-50 text-red-800" : ""}`}>{r.left ?? ""}</p>
                <p data-side="right" className={`whitespace-pre-wrap break-words border-l p-2 ${r.changed && r.right !== undefined ? "bg-green-50 text-green-800" : ""}`}>{r.right ?? ""}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500">Only text is compared. Images, layout and fonts are not.</p>
        </div>
      )}
    </div>
  );
}
