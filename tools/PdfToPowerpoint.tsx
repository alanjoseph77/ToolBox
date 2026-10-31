"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { canvasToBlob, download, formatBytes } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";
import { imagesToPptx } from "@/lib/pptx";

const MAX_PAGES = 100;

export default function PdfToPowerpoint() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ bytes: Uint8Array; slides: number; name: string } | null>(null);

  const run = async (f: File[]) => {
    if (!f[0]) return; setBusy(true); setError(""); setOut(null); setProgress(0);
    try {
      const pdf = await openPdf(f[0]);
      if (pdf.numPages > MAX_PAGES) throw new Error(`This PDF has ${pdf.numPages} pages. Please use one with ${MAX_PAGES} pages or fewer.`);
      const images = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const c = await renderPage(pdf, i, 1.6);
        images.push({ jpeg: new Uint8Array(await (await canvasToBlob(c, "image/jpeg", 0.88)).arrayBuffer()), w: c.width, h: c.height });
        setProgress(i / pdf.numPages);
      }
      setOut({ bytes: imagesToPptx(images), slides: images.length, name: f[0].name.replace(/\.pdf$/i, "") + ".pptx" });
    } catch (e) { setError((e as Error).message.includes("pages") ? (e as Error).message : "Could not open this PDF. It may be damaged or password protected."); }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={run} hint="Add a PDF. Each page becomes one slide. It stays on your device." />
      <WaterLoader active={busy} progress={progress || undefined} label="Building your slides…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {out && <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-sm" data-done="1">{out.slides} slide{out.slides === 1 ? "" : "s"} · {formatBytes(out.bytes.length)}</p>
        <button className="btn w-full" onClick={() => download(out.bytes, out.name, "application/vnd.openxmlformats-officedocument.presentationml.presentation")}>Download {out.name}</button></div>}
      <p className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Every slide is a picture of the PDF page, so it looks exactly like the PDF but the text cannot be edited in PowerPoint. This is a good way to present a PDF. For editable text, use PDF to Word.</p>
    </div>
  );
}
