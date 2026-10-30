"use client";
import { useState } from "react";
import { Document, HeadingLevel, Packer, PageBreak, Paragraph, TextRun } from "docx";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { openPdf, pageTextItems, toLines } from "@/lib/pdfjs";

export default function PdfToWord() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (f: File) => {
    setBusy(true); setError("");
    try {
      const pdf = await openPdf(f);
      const children: Paragraph[] = [];
      let total = 0;
      for (let p = 1; p <= pdf.numPages; p++) {
        setStatus(`Reading page ${p} of ${pdf.numPages}…`);
        const lines = toLines(await pageTextItems(pdf, p));
        const sizes = lines.map((l) => Math.max(...l.map((i) => i.h))).sort((a, b) => a - b);
        const body = sizes[Math.floor(sizes.length / 2)] || 10;
        let para: string[] = [], prevY = -1, prevH = body;
        const flush = () => { if (para.length) { children.push(new Paragraph({ children: [new TextRun(para.join(" "))], spacing: { after: 160 } })); para = []; } };
        for (const line of lines) {
          const h = Math.max(...line.map((i) => i.h)), text = line.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
          total += text.length;
          if (h > body * 1.25 && text.length < 120) { flush(); children.push(new Paragraph({ text, heading: h > body * 1.6 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 })); prevY = -1; continue; }
          if (prevY >= 0 && line[0].y - prevY > prevH * 1.9) flush();
          para.push(text); prevY = line[0].y; prevH = h;
        }
        flush();
        if (p < pdf.numPages) children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      if (!total) { setError("No selectable text found. This looks like a scanned PDF. Use the PDF OCR tool instead."); setBusy(false); setStatus(""); return; }
      download(await Packer.toBlob(new Document({ sections: [{ children }] })), f.name.replace(/\.pdf$/i, "") + ".docx");
      setStatus("Done. Your Word file was downloaded.");
    } catch { setError("Could not convert this PDF. It may be encrypted or damaged."); setStatus(""); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && !busy && run(f[0])} />
      {status && <p className="text-sm text-neutral-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-500">Extracts the text, headings and paragraphs into an editable .docx. Complex layouts, columns and images are not reproduced.</p>
    </div>
  );
}
