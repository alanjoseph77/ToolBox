"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download } from "@/lib/files";
import { pagesToMarkdown } from "@/lib/pdfMarkdown";
import { openPdf, pageTextItems } from "@/lib/pdfjs";

export default function PdfToMarkdown() {
  const [md, setMd] = useState("");
  const [name, setName] = useState("document");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setBusy(true); setError(""); setMd(""); setName(f.name.replace(/\.pdf$/i, ""));
    try {
      const pdf = await openPdf(f), pages = [];
      for (let p = 1; p <= pdf.numPages; p++) pages.push(await pageTextItems(pdf, p));
      const out = pagesToMarkdown(pages);
      if (!out.trim()) setError("No selectable text found. For scanned PDFs, run PDF OCR first."); else setMd(out);
    } catch { setError("Could not read that PDF."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={run} hint="Headings, lists and paragraphs are rebuilt on your device." />
      <WaterLoader active={busy} label="Converting to Markdown…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {md && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <textarea aria-label="Markdown" className="input h-80 w-full font-mono text-xs" value={md} onChange={(e) => setMd(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => download(new Blob([md], { type: "text/markdown" }), `${name}.md`, "text/markdown")}>Download .md</button>
            <CopyButton text={md} label="Copy Markdown" />
          </div>
          <p className="text-xs text-neutral-500">Tables and images are not converted. Check headings, since they are guessed from the font size.</p>
        </div>
      )}
    </div>
  );
}
