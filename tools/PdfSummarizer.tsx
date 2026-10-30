"use client";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import CopyButton from "@/components/CopyButton";
import Dropzone from "@/components/Dropzone";
import { callAi } from "@/lib/ai";
import { openPdf, pageTextItems, toLines } from "@/lib/pdfjs";

export default function PdfSummarizer() {
  const [length, setLength] = useState("medium");
  const [format, setFormat] = useState("bullets");
  const [out, setOut] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const run = async (files: File[]) => {
    if (!files[0]) return;
    setError(""); setOut(""); setStatus("Reading PDF…");
    try {
      const pdf = await openPdf(files[0]);
      let text = "";
      for (let p = 1; p <= pdf.numPages && text.length < 60000; p++)
        text += toLines(await pageTextItems(pdf, p)).map((l) => l.map((i) => i.str).join(" ")).join("\n") + "\n";
      if (text.trim().length < 20) throw new Error("No selectable text found. For scanned PDFs, run PDF OCR first.");
      setStatus("Summarising…");
      setOut(await callAi({ action: "summarize", text: text.slice(0, 60000), length, format }));
    } catch (e) { setError((e as Error).message); }
    setStatus("");
  };

  return (
    <div className="space-y-4">
      <AiNotice />
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select className="input !w-auto" value={length} onChange={(e) => setLength(e.target.value)}><option value="short">Short</option><option value="medium">Medium</option><option value="detailed">Detailed</option></select>
        <select className="input !w-auto" value={format} onChange={(e) => setFormat(e.target.value)}><option value="bullets">Bullet points</option><option value="prose">Paragraph</option></select>
      </div>
      <Dropzone accept="application/pdf" onFiles={run} hint="Text is extracted on your device; only the text is sent to the AI to summarise." />
      {status && <p className="text-sm text-slate-500">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && <div className="space-y-2"><div className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm">{out}</div><CopyButton text={out} /></div>}
    </div>
  );
}
