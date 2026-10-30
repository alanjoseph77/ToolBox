"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import CopyButton from "@/components/CopyButton";
import { download } from "@/lib/files";
import { createOcr, ocrLanguages } from "@/lib/tesseract";

export default function ImageToText() {
  const [lang, setLang] = useState("eng");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (files: File[]) => {
    if (!files[0]) return;
    setBusy(true); setError(""); setText(""); setProgress(0);
    try {
      const worker = await createOcr(lang, setProgress);
      const { data } = await worker.recognize(files[0]);
      setText(data.text.trim()); await worker.terminate();
      if (!data.text.trim()) setError("No text was found in this image.");
    } catch { setError("OCR failed. Check your connection (language data may need to download) and try again."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4"><label className="label">Language of the text</label>
        <select className="input" value={lang} disabled={busy} onChange={(e) => setLang(e.target.value)}>{ocrLanguages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
      <Dropzone accept="image/*" onFiles={run} hint="Photos of documents, screenshots and scans work best." />
      {busy && <p className="text-sm text-neutral-500">Reading text… {Math.round(progress * 100)}%</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {text && (
        <div className="space-y-2">
          <textarea className="input h-64" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2"><CopyButton text={text} /><button className="btn-ghost !py-1.5" onClick={() => download(new Blob([text], { type: "text/plain" }), "text.txt")}>Download .txt</button></div>
        </div>
      )}
    </div>
  );
}
