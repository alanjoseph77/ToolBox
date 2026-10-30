"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  };

  const merge = async () => {
    setBusy(true); setError("");
    try {
      const out = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
      }
      download(await out.save(), "merged.pdf", "application/pdf");
    } catch { setError("One of the files could not be read. Make sure all are valid, unprotected PDFs."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" multiple onFiles={(f) => setFiles((p) => [...p, ...f.filter((x) => x.type === "application/pdf")])} />
      {files.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 p-3 text-sm">
              <span className="flex-1 truncate">{i + 1}. {f.name} <span className="text-neutral-400">({formatBytes(f.size)})</span></span>
              <button className="btn-ghost !px-2 !py-1" onClick={() => move(i, -1)}>↑</button>
              <button className="btn-ghost !px-2 !py-1" onClick={() => move(i, 1)}>↓</button>
              <button className="btn-ghost !px-2 !py-1" onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <WaterLoader active={busy} label="Merging your PDFs…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={files.length < 2 || busy} onClick={merge}>{busy ? "Merging…" : `Merge ${files.length || ""} PDFs`}</button>
    </div>
  );
}
