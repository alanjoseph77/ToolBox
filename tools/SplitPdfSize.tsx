"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PartsList, outName, useJob, type Part } from "@/components/PdfShell";
import { formatBytes } from "@/lib/files";
import { splitBySize } from "@/lib/pdfOps";

const presets = [{ l: "500 KB", v: 500 * 1024 }, { l: "1 MB", v: 1024 ** 2 }, { l: "2 MB", v: 2 * 1024 ** 2 }, { l: "5 MB", v: 5 * 1024 ** 2 }, { l: "10 MB", v: 10 * 1024 ** 2 }];

export default function SplitPdfSize() {
  const [max, setMax] = useState(1024 ** 2);
  const [parts, setParts] = useState<Part[]>([]);
  const { busy, error, run } = useJob();
  return (
    <PdfShell hint="Useful for email limits and upload forms with a size cap.">
      {([f]) => (
        <>
          <p className="text-sm">{f.name} is {formatBytes(f.bytes.length)}.</p>
          <div><p className="label">Each part at most</p>
            <div className="flex flex-wrap gap-2">{presets.map((p) => <button key={p.l} className={p.v === max ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMax(p.v)}>{p.l}</button>)}</div></div>
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => {
            const out = await splitBySize(f.bytes, max);
            setParts(out.map((bytes, i) => ({ name: outName(f.name, `-part-${String(i + 1).padStart(2, "0")}`), bytes })));
          })}>{busy ? "Splitting…" : `Split into parts of ${formatBytes(max)} or less`}</button>
          <JobStatus busy={busy} error={error} label="Measuring and splitting…" />
          <PartsList parts={parts} zipName={outName(f.name, "-parts").replace(/\.pdf$/, ".zip")} />
          {parts.some((p) => p.bytes.length > max) && <p className="text-xs text-neutral-500">A single page larger than the limit can&apos;t be split further, so that part is bigger.</p>}
        </>
      )}
    </PdfShell>
  );
}
