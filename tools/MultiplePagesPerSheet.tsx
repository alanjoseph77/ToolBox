"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { extractRange, nUp, perSheetOptions, sheetSizes, type SheetSize } from "@/lib/pdfOps";

export default function MultiplePagesPerSheet() {
  const [per, setPer] = useState<2 | 4 | 6 | 9 | 16>(4);
  const [size, setSize] = useState<SheetSize>("A4");
  const [border, setBorder] = useState(true);
  const { busy, error, run } = useJob();
  return (
    <PdfShell hint="Print handouts or save paper by putting several pages on one sheet.">
      {([f]) => (
        <>
          <div><p className="label">Pages per sheet</p><div className="flex gap-2">
            {perSheetOptions.map((n) => <button key={n} className={n === per ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setPer(n)}>{n}</button>)}
          </div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Paper size</label><select className="input" value={size} onChange={(e) => setSize(e.target.value as SheetSize)}>{(Object.keys(sheetSizes) as SheetSize[]).map((s) => <option key={s}>{s}</option>)}</select></div>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} /> Draw borders</label>
          </div>
          <PdfPreview deps={[f.id, per, size, border]} make={async () => nUp(await extractRange(f.bytes, Array.from({ length: Math.min(f.pages, per) }, (_, i) => i)), per, size, border)} />
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await nUp(f.bytes, per, size, border), outName(f.name, `-${per}-per-sheet`), "application/pdf"))}>{busy ? "Arranging…" : `Make ${Math.ceil(f.pages / per)} sheet${Math.ceil(f.pages / per) === 1 ? "" : "s"}`}</button>
          <JobStatus busy={busy} error={error} label="Arranging your pages…" />
        </>
      )}
    </PdfShell>
  );
}
