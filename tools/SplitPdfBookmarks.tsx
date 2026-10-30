"use client";
import { useEffect, useState } from "react";
import PdfShell, { JobStatus, PartsList, outName, useJob, type Part, type PdfFile } from "@/components/PdfShell";
import { extractRange } from "@/lib/pdfOps";
import { openPdfBytes, outlinePages } from "@/lib/pdfjs";

const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Untitled";

function Splitter({ f }: { f: PdfFile }) {
  const [marks, setMarks] = useState<{ title: string; page: number }[] | null>(null);
  const [front, setFront] = useState(true);
  const [parts, setParts] = useState<Part[]>([]);
  const { busy, error, run } = useJob();
  useEffect(() => { setMarks(null); setParts([]); openPdfBytes(f.bytes).then(outlinePages).then(setMarks).catch(() => setMarks([])); }, [f.id, f.bytes]);

  if (!marks) return <p className="text-sm text-neutral-500">Reading bookmarks…</p>;
  if (!marks.length) return <p className="text-sm">This PDF has no bookmarks (table of contents). Try <a href="/split-pdf-by-text" className="underline">Split PDF by Text</a> or <a href="/split-pdf" className="underline">Split PDF</a> instead.</p>;
  return (
    <>
      <div><p className="label">{marks.length} bookmark{marks.length === 1 ? "" : "s"} found</p>
        <ol className="max-h-56 overflow-auto rounded-lg border p-3 text-sm">{marks.map((m, i) => <li key={i} className="flex justify-between gap-3"><span className="truncate">{m.title}</span><span className="text-neutral-400">p. {m.page + 1}</span></li>)}</ol></div>
      {marks[0].page > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={front} onChange={(e) => setFront(e.target.checked)} /> Keep the pages before the first bookmark as their own file</label>}
      <button className="btn w-full" disabled={busy} onClick={() => run(async () => {
        const segs: { name: string; from: number; to: number }[] = [];
        if (front && marks[0].page > 0) segs.push({ name: "Front matter", from: 0, to: marks[0].page - 1 });
        marks.forEach((m, i) => { const to = (marks[i + 1]?.page ?? f.pages) - 1; if (to >= m.page) segs.push({ name: m.title, from: m.page, to }); });
        setParts(await Promise.all(segs.map(async (s, i) => ({ name: `${String(i + 1).padStart(2, "0")}-${safe(s.name)}.pdf`, bytes: await extractRange(f.bytes, Array.from({ length: s.to - s.from + 1 }, (_, k) => s.from + k)) }))));
      })}>{busy ? "Splitting…" : "Split at every bookmark"}</button>
      <JobStatus busy={busy} error={error} label="Splitting at your bookmarks…" />
      <PartsList parts={parts} zipName={outName(f.name, "-chapters").replace(/\.pdf$/, ".zip")} />
    </>
  );
}

export default function SplitPdfBookmarks() {
  return <PdfShell hint="Splits at the top-level entries of the PDF's table of contents.">{([f]) => <Splitter f={f} />}</PdfShell>;
}
