"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (f: File) => {
    setFile(f); setResult(null); setError(""); setBusy(true);
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      doc.setTitle(""); doc.setAuthor(""); doc.setSubject(""); doc.setKeywords([]);
      doc.setProducer(""); doc.setCreator("");
      // Re-serialising with object streams removes unused objects and packs the xref table.
      setResult(await doc.save({ useObjectStreams: true }));
    } catch { setError("Could not process this PDF. It may be encrypted or damaged."); }
    setBusy(false);
  };

  const saved = file && result ? Math.max(0, Math.round((1 - result.length / file.size) * 100)) : 0;

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && run(f[0])} />
      {busy && <p className="text-sm text-neutral-500">Optimising…</p>}
      <WaterLoader active={busy} label="Optimising your PDF…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
      {file && result && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{formatBytes(file.size)} → <b>{formatBytes(result.length)}</b> ({saved}% smaller)</p>
          {result.length >= file.size && <p className="text-xs text-neutral-600">This PDF is already well optimised; the download is the original size or similar. Image-heavy PDFs need server-side recompression, coming later.</p>}
          <button className="btn w-full" onClick={() => download(result, "compressed.pdf", "application/pdf")} disabled={result.length >= file.size}>Download compressed PDF</button>
        </div>
      )}
    </div>
  );
}
