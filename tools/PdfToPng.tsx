"use client";
import { useState } from "react";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";
import { makeZip } from "@/lib/zip";

export default function PdfToPng() {
  const [scale, setScale] = useState(2);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (f: File) => {
    setError(""); setBusy(true);
    try {
      const pdf = await openPdf(f), base = f.name.replace(/\.pdf$/i, ""), files: { name: string; data: Uint8Array }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Converting page ${i} of ${pdf.numPages}…`);
        const blob = await canvasToBlob(await renderPage(pdf, i, scale), "image/png");
        files.push({ name: `${base}-page-${i}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      if (files.length === 1) download(new Blob([files[0].data as BlobPart], { type: "image/png" }), files[0].name);
      else download(makeZip(files), `${base}-pages.zip`, "application/zip");
      setStatus(`Done: ${files.length} PNG image${files.length > 1 ? "s" : ""}${files.length > 1 ? " in one ZIP" : ""}.`);
    } catch { setError("Could not convert this PDF. It may be encrypted or damaged."); setStatus(""); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <label className="label">Quality</label>
        <div className="flex gap-2">{[[1, "Standard"], [2, "High"], [3, "Very high"]].map(([s, l]) => <button key={s} disabled={busy} className={scale === s ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setScale(s as number)}>{l}</button>)}</div>
      </div>
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && !busy && run(f[0])} />
      {!busy && status && <p className="text-sm text-neutral-600" data-testid="png-status">{status}</p>}
      <WaterLoader active={busy} label={status || "Rendering your pages…"} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
