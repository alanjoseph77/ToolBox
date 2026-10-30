"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import CopyButton from "@/components/CopyButton";
import { download } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";
import { createOcr, ocrLanguages } from "@/lib/tesseract";

export default function PdfOcr() {
  const [lang, setLang] = useState("eng");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (files: File[]) => {
    if (!files[0]) return;
    setBusy(true); setError(""); setText("");
    try {
      const pdf = await openPdf(files[0]);
      let current = 0;
      const worker = await createOcr(lang, (p) => setStatus(`Page ${current} of ${pdf.numPages}: ${Math.round(p * 100)}%`));
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        current = i; setStatus(`Page ${i} of ${pdf.numPages}…`);
        const { data } = await worker.recognize(await renderPage(pdf, i, 2));
        pages.push(`--- Page ${i} ---\n${data.text.trim()}`);
        setText(pages.join("\n\n"));
      }
      await worker.terminate(); setStatus("");
    } catch { setError("OCR failed. The PDF may be encrypted, or language data could not be downloaded."); setStatus(""); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4"><label className="label">Language of the text</label>
        <select className="input" value={lang} disabled={busy} onChange={(e) => setLang(e.target.value)}>{ocrLanguages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
      <Dropzone accept="application/pdf" onFiles={(f) => !busy && run(f)} hint="Best for scanned PDFs. Large files take a while on a phone." />
      {status && <p className="text-sm text-slate-500">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {text && (
        <div className="space-y-2">
          <textarea className="input h-72" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2"><CopyButton text={text} /><button className="btn-ghost !py-1.5" onClick={() => download(new Blob([text], { type: "text/plain" }), "ocr.txt")}>Download .txt</button></div>
        </div>
      )}
    </div>
  );
}
