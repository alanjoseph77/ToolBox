"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PartsList, outName, useJob, type Part } from "@/components/PdfShell";
import { splitEveryPage } from "@/lib/pdfOps";

export default function PdfToZip() {
  const [parts, setParts] = useState<Part[]>([]);
  const { busy, error, run } = useJob();
  return (
    <PdfShell hint="Every page becomes its own PDF, bundled into one ZIP file.">
      {([f]) => (
        <>
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => {
            const pad = String(f.pages).length;
            setParts((await splitEveryPage(f.bytes)).map((bytes, i) => ({ name: `page-${String(i + 1).padStart(pad, "0")}.pdf`, bytes })));
          })}>{busy ? "Working…" : `Convert ${f.pages} pages to ZIP`}</button>
          <JobStatus busy={busy} error={error} label="Separating your pages…" />
          <PartsList parts={parts} zipName={outName(f.name, "-pages").replace(/\.pdf$/, ".zip")} />
        </>
      )}
    </PdfShell>
  );
}
