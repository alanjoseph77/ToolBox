"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { extractRange, flipPages } from "@/lib/pdfOps";

export default function FlipPdf() {
  const [axis, setAxis] = useState<"horizontal" | "vertical">("horizontal");
  const { busy, error, run } = useJob();
  return (
    <PdfShell hint="Mirrors every page, for example to fix a scan taken through the back of the paper.">
      {([f]) => (
        <>
          <div><p className="label">Mirror</p><div className="flex gap-2">
            <button className={axis === "horizontal" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setAxis("horizontal")}>Left ↔ right</button>
            <button className={axis === "vertical" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setAxis("vertical")}>Top ↕ bottom</button>
          </div></div>
          <PdfPreview deps={[f.id, axis]} make={async () => flipPages(await extractRange(f.bytes, [0]), axis)} />
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await flipPages(f.bytes, axis), outName(f.name, "-flipped"), "application/pdf"))}>{busy ? "Flipping…" : "Flip & download"}</button>
          <JobStatus busy={busy} error={error} label="Mirroring your pages…" />
        </>
      )}
    </PdfShell>
  );
}
