"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";

export default function PdfToJpg() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);

  const run = async (f: File) => {
    setName(f.name.replace(/\.pdf$/i, "")); setError(""); setBusy(true);
    try {
      const pdf = await openPdf(f);
      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Converting page ${i} of ${pdf.numPages}…`);
        const canvas = await renderPage(pdf, i, scale);
        download(await canvasToBlob(canvas, "image/jpeg", 0.92), `${f.name.replace(/\.pdf$/i, "")}-page-${i}.jpg`);
        await new Promise((r) => setTimeout(r, 300));
      }
      setStatus(`Done: ${pdf.numPages} image${pdf.numPages > 1 ? "s" : ""} downloaded.`);
    } catch { setError("Could not convert this PDF. It may be encrypted or damaged."); setStatus(""); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <label className="label">Quality</label>
        <div className="flex gap-2">
          {[[1, "Standard"], [2, "High"], [3, "Very high"]].map(([s, l]) => (
            <button key={s} disabled={busy} className={scale === s ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setScale(s as number)}>{l}</button>
          ))}
        </div>
      </div>
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && !busy && run(f[0])} />
      {name && status && <p className="text-sm text-neutral-600">{name}.pdf: {status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-500">If your browser asks, allow multiple downloads so every page is saved.</p>
    </div>
  );
}
