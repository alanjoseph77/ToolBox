"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { extractRange, rotatePages, type PageSelect } from "@/lib/pdfOps";
import { parseRanges } from "@/lib/ranges";

export default function RotatePdf() {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [which, setWhich] = useState<"all" | "odd" | "even" | "custom">("all");
  const [custom, setCustom] = useState("");
  const { busy, error, run } = useJob();
  return (
    <PdfShell>
      {([f]) => {
        const sel = (): PageSelect => (which === "custom" ? parseRanges(custom, f.pages) : which);
        return (
          <>
            <div><p className="label">Rotate</p><div className="flex gap-2">
              {([[90, "90° right"], [180, "180°"], [270, "90° left"]] as const).map(([a, l]) => <button key={a} className={a === angle ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setAngle(a)}>{l}</button>)}
            </div></div>
            <div><p className="label">Pages</p><div className="flex flex-wrap gap-2">
              {(["all", "odd", "even", "custom"] as const).map((w) => <button key={w} className={w === which ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setWhich(w)}>{w === "custom" ? "Choose pages" : w[0].toUpperCase() + w.slice(1)}</button>)}
            </div>
              {which === "custom" && <input className="input mt-2" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 1-3, 5" />}</div>
            <PdfPreview deps={[f.id, angle]} make={async () => rotatePages(await extractRange(f.bytes, [0]), angle, "all")} />
            <button className="btn w-full" disabled={busy || (which === "custom" && !custom.trim())} onClick={() => run(async () => download(await rotatePages(f.bytes, angle, sel()), outName(f.name, "-rotated"), "application/pdf"))}>{busy ? "Rotating…" : "Rotate & download"}</button>
            <JobStatus busy={busy} error={error} label="Rotating your pages…" />
          </>
        );
      }}
    </PdfShell>
  );
}
