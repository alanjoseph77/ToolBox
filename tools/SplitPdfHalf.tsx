"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { extractRange, splitInHalf } from "@/lib/pdfOps";

export default function SplitPdfHalf() {
  const [mode, setMode] = useState<"vertical" | "horizontal">("vertical");
  const [rtl, setRtl] = useState(false);
  const { busy, error, run } = useJob();
  return (
    <PdfShell hint="Best for scans where each image holds two pages side by side.">
      {([f]) => (
        <>
          <div><p className="label">Cut</p>
            <div className="flex gap-2">
              <button className={mode === "vertical" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("vertical")}>Down the middle (left | right)</button>
              <button className={mode === "horizontal" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("horizontal")}>Across the middle (top / bottom)</button>
            </div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rtl} onChange={(e) => setRtl(e.target.checked)} /> Reverse the order of the two halves (for right-to-left books)</label>
          <PdfPreview deps={[f.id, mode, rtl]} make={async () => splitInHalf(await extractRange(f.bytes, [0]), mode, rtl)} />
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await splitInHalf(f.bytes, mode, rtl), outName(f.name, "-halves"), "application/pdf"))}>{busy ? "Splitting…" : `Split every page in half (${f.pages * 2} pages)`}</button>
          <JobStatus busy={busy} error={error} label="Cutting your pages in half…" />
        </>
      )}
    </PdfShell>
  );
}
