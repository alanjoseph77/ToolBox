"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";

export default function JpgToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const build = async () => {
    setBusy(true);
    const pdf = await PDFDocument.create();
    for (const f of files) {
      let bytes: Uint8Array; let isPng = false;
      if (f.type === "image/jpeg") bytes = new Uint8Array(await f.arrayBuffer());
      else if (f.type === "image/png") { bytes = new Uint8Array(await f.arrayBuffer()); isPng = true; }
      else { // convert other formats (webp etc.) through a canvas
        const img = await loadImage(f);
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        bytes = new Uint8Array(await (await canvasToBlob(c, "image/png")).arrayBuffer()); isPng = true;
      }
      const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      pdf.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    download(await pdf.save(), "images.pdf", "application/pdf");
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={(f) => setFiles((p) => [...p, ...f.filter((x) => x.type.startsWith("image/"))])} />
      {files.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 p-3 text-sm">
              <span className="flex-1 truncate">{i + 1}. {f.name}</span>
              <button className="btn-ghost !px-2 !py-1" onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <button className="btn w-full" disabled={!files.length || busy} onClick={build}>{busy ? "Creating…" : "Create PDF"}</button>
      <WaterLoader active={busy} label="Building your PDF…" />
    </div>
  );
}
