"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PartsList, outName, useJob, type Part, type PdfFile } from "@/components/PdfShell";
import { extractRange } from "@/lib/pdfOps";
import { openPdfBytes, pageTexts } from "@/lib/pdfjs";

function Splitter({ f }: { f: PdfFile }) {
  const [needle, setNeedle] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [mode, setMode] = useState<"start" | "end">("start");
  const [texts, setTexts] = useState<{ id: string; list: string[] } | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const { busy, error, run } = useJob();

  const matches = (list: string[]) => {
    if (!needle.trim()) return [];
    const n = matchCase ? needle : needle.toLowerCase();
    return list.map((t, i) => ((matchCase ? t : t.toLowerCase()).includes(n) ? i : -1)).filter((i) => i >= 0);
  };
  const ensureTexts = async () => {
    if (texts?.id === f.id) return texts.list;
    const list = await pageTexts(await openPdfBytes(f.bytes));
    setTexts({ id: f.id, list }); return list;
  };
  const hits = texts?.id === f.id ? matches(texts.list) : [];

  const segments = (hit: number[], total: number) => {
    const cuts = mode === "start" ? hit.filter((h) => h > 0) : hit.filter((h) => h < total - 1).map((h) => h + 1);
    const bounds = [0, ...cuts, total];
    return bounds.slice(0, -1).map((s, i) => Array.from({ length: bounds[i + 1] - s }, (_, k) => s + k));
  };

  return (
    <>
      <div><label className="label">Split at pages containing</label><input className="input" value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="e.g. Chapter, Invoice No., Page 1 of" /></div>
      <div className="flex flex-wrap gap-2">
        <button className={mode === "start" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("start")}>Start a new file at each match</button>
        <button className={mode === "end" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("end")}>End a file at each match</button>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} /> Match upper/lower case</label>
      {texts?.id === f.id && needle.trim() && <p className="text-sm">{hits.length ? `Found on page${hits.length === 1 ? "" : "s"} ${hits.map((h) => h + 1).join(", ")}` : "No page contains that text."}</p>}
      <button className="btn w-full" disabled={busy || !needle.trim()} onClick={() => run(async () => {
        const list = await ensureTexts(), hit = matches(list);
        if (!hit.length) throw new Error("No page contains that text. Scanned PDFs need OCR first.");
        const segs = segments(hit, f.pages);
        setParts(await Promise.all(segs.map(async (idx, i) => ({ name: outName(f.name, `-part-${String(i + 1).padStart(2, "0")}`), bytes: await extractRange(f.bytes, idx) }))));
      })}>{busy ? "Searching…" : "Split"}</button>
      <JobStatus busy={busy} error={error} label="Reading the text on each page…" />
      <PartsList parts={parts} zipName={outName(f.name, "-parts").replace(/\.pdf$/, ".zip")} />
    </>
  );
}

export default function SplitPdfText() {
  return <PdfShell hint="Works on PDFs with selectable text. Scanned PDFs need OCR first.">{([f]) => <Splitter f={f} />}</PdfShell>;
}
