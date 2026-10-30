"use client";
import { useState } from "react";
import PdfShell, { JobStatus, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { alternateMix } from "@/lib/pdfOps";

export default function AlternateMixPdf() {
  const [reverse, setReverse] = useState<Record<string, boolean>>({});
  const { busy, error, run } = useJob();
  return (
    <PdfShell multiple min={2} hint="Add two or more PDFs. Pages are taken in turn from each file: A1, B1, A2, B2…">
      {(files) => (
        <>
          <div className="space-y-2">
            <p className="label">Reverse the page order of…</p>
            {files.map((f, i) => (
              <label key={f.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!reverse[f.id]} onChange={(e) => setReverse({ ...reverse, [f.id]: e.target.checked })} /> {i + 1}. {f.name}
              </label>
            ))}
            <p className="text-xs text-neutral-500">Tip: if you scanned the fronts, then flipped the stack and scanned the backs, reverse the backs file.</p>
          </div>
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => {
            download(await alternateMix(files.map((f) => f.bytes), files.map((f) => !!reverse[f.id])), outName(files[0].name, "-mixed"), "application/pdf");
          })}>{busy ? "Mixing…" : "Alternate & mix"}</button>
          <JobStatus busy={busy} error={error} label="Mixing your pages…" />
        </>
      )}
    </PdfShell>
  );
}
