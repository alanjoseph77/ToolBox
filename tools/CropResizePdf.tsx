"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { cropResize, extractRange, sheetSizes, type SheetSize } from "@/lib/pdfOps";

export default function CropResizePdf() {
  const [m, setM] = useState({ top: "0", right: "0", bottom: "0", left: "0" });
  const [unit, setUnit] = useState<"mm" | "pt">("mm");
  const [target, setTarget] = useState<SheetSize | "none">("none");
  const { busy, error, run } = useJob();
  const opts = () => ({ top: +m.top || 0, right: +m.right || 0, bottom: +m.bottom || 0, left: +m.left || 0, unit, target });
  return (
    <PdfShell hint="Trim white margins and/or fit every page onto a standard paper size.">
      {([f]) => (
        <>
          <div><p className="label">Trim margins</p>
            <div className="grid grid-cols-2 gap-3">
              {(["top", "right", "bottom", "left"] as const).map((k) => (
                <div key={k}><label className="label capitalize">{k}</label><input type="number" min={0} className="input" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} /></div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">{(["mm", "pt"] as const).map((u) => <button key={u} className={u === unit ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setUnit(u)}>{u}</button>)}</div></div>
          <div><label className="label">Fit pages to paper</label>
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value as SheetSize | "none")}>
              <option value="none">Keep the original page size</option>
              {(Object.keys(sheetSizes) as SheetSize[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <PdfPreview deps={[f.id, m, unit, target]} make={async () => cropResize(await extractRange(f.bytes, [0]), opts())} />
          <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await cropResize(f.bytes, opts()), outName(f.name, "-cropped"), "application/pdf"))}>{busy ? "Working…" : "Apply & download"}</button>
          <JobStatus busy={busy} error={error} label="Trimming your pages…" />
        </>
      )}
    </PdfShell>
  );
}
