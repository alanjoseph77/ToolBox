"use client";
import { useEffect, useState } from "react";
import PdfShell, { JobStatus, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { readDetails, setDetails, type PdfDetails } from "@/lib/pdfOps";

const fields: [keyof PdfDetails, string][] = [["title", "Title"], ["author", "Author"], ["subject", "Subject"], ["keywords", "Keywords (comma separated)"], ["creator", "Creator"], ["producer", "Producer"]];

function Editor({ file }: { file: { id: string; name: string; bytes: Uint8Array } }) {
  const [d, setD] = useState<PdfDetails>({});
  const { busy, error, run } = useJob();
  useEffect(() => { readDetails(file.bytes).then(setD).catch(() => {}); }, [file.id, file.bytes]);
  return (
    <>
      {fields.map(([k, label]) => <div key={k}><label className="label">{label}</label><input className="input" value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} /></div>)}
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="btn" disabled={busy} onClick={() => run(async () => download(await setDetails(file.bytes, d), outName(file.name, "-edited"), "application/pdf"))}>{busy ? "Saving…" : "Save details & download"}</button>
        <button className="btn-ghost" disabled={busy} onClick={() => run(async () => download(await setDetails(file.bytes, {}), outName(file.name, "-clean"), "application/pdf"))}>Remove all details (privacy)</button>
      </div>
      <JobStatus busy={busy} error={error} label="Saving your PDF…" />
    </>
  );
}

export default function EditPdfDetails() {
  return <PdfShell hint="See and change the title, author and other hidden information inside a PDF.">{([f]) => <Editor file={f} />}</PdfShell>;
}
