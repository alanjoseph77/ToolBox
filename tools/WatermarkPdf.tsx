"use client";
import { useState } from "react";
import PdfShell, { JobStatus, PdfPreview, outName, useJob } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { addWatermark, extractRange } from "@/lib/pdfOps";

export default function WatermarkPdf() {
  const [text, setText] = useState("CONFIDENTIAL");
  const [size, setSize] = useState(48);
  const [opacity, setOpacity] = useState(25);
  const [angle, setAngle] = useState(45);
  const [color, setColor] = useState("#888888");
  const [tile, setTile] = useState(false);
  const { busy, error, run } = useJob();
  const opts = () => ({ text, size, opacity: opacity / 100, angle, color, tile });
  return (
    <PdfShell hint="Stamp text across every page, such as DRAFT or CONFIDENTIAL.">
      {([f]) => (
        <>
          <div><label className="label">Watermark text</label><input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Size: {size}</label><input type="range" min={12} max={120} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full" /></div>
            <div><label className="label">Opacity: {opacity}%</label><input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full" /></div>
            <div><label className="label">Angle: {angle}°</label><input type="range" min={0} max={90} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full" /></div>
            <div><label className="label">Colour</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16" aria-label="Colour" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} /> Repeat across the page</label>
          <PdfPreview deps={[f.id, text, size, opacity, angle, color, tile]} make={async () => addWatermark(await extractRange(f.bytes, [0]), opts())} />
          <button className="btn w-full" disabled={busy || !text.trim()} onClick={() => run(async () => download(await addWatermark(f.bytes, opts()), outName(f.name, "-watermarked"), "application/pdf"))}>{busy ? "Stamping…" : "Add watermark & download"}</button>
          <p className="text-xs text-neutral-500">Latin letters, numbers and common symbols are supported.</p>
          <JobStatus busy={busy} error={error} label="Stamping your pages…" />
        </>
      )}
    </PdfShell>
  );
}
