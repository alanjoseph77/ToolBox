"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { addPageNumbers, extractRange, numberPositions, type NumberPosition } from "@/lib/pdfOps";

const formats = ["{n}", "Page {n}", "Page {n} of {total}", "{n} / {total}", "- {n} -"];

export default function AddPageNumbers() {
  const [format, setFormat] = useState("Page {n} of {total}");
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [size, setSize] = useState(11);
  const [start, setStart] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const { busy, error, run } = useJob();
  const opts = () => ({ format, position, size, start, skipFirst });
  return (
    <PdfShell>
      {([f]) => (
        <>
          <div><label className="label">Format ({"{n}"} = number, {"{total}"} = page count)</label>
            <input className="input" value={format} onChange={(e) => setFormat(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">{formats.map((x) => <button key={x} className="btn-ghost !min-h-0 !px-3 !py-1 text-xs" onClick={() => setFormat(x)}>{x}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Position</label><select className="input" value={position} onChange={(e) => setPosition(e.target.value as NumberPosition)}>{numberPositions.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="label">Size: {size}</label><input type="range" min={8} max={24} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full" /></div>
            <div><label className="label">Start at</label><input type="number" className="input" value={start} onChange={(e) => setStart(+e.target.value || 1)} /></div>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} /> Skip the first page (cover)</label>
          </div>
          <PdfPreview deps={[f.id, format, position, size, start, skipFirst]} make={async () => addPageNumbers(await extractRange(f.bytes, [0]), { ...opts(), skipFirst: false })} />
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await addPageNumbers(f.bytes, opts()), outName(f.name, "-numbered"), "application/pdf"))}>{busy ? "Numbering…" : "Add page numbers"}</button>
          <JobStatus busy={busy} error={error} label="Numbering your pages…" />
        </>
      )}
    </PdfShell>
  );
}
