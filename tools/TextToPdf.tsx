"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import PasteOrFile from "@/components/PasteOrFile";
import { download, formatBytes } from "@/lib/files";
import { blocksToPdf, type Block } from "@/lib/textPdf";

export default function TextToPdf() {
  const [text, setText] = useState("");
  const [name, setName] = useState("document");
  const [title, setTitle] = useState("");
  const [out, setOut] = useState<{ bytes: Uint8Array; pages: number } | null>(null);
  const [error, setError] = useState("");

  const make = async () => {
    setError(""); setOut(null);
    try {
      // every line keeps its own line, and an empty line leaves a gap
      const blocks: Block[] = [];
      if (title.trim()) blocks.push({ text: title.trim(), style: "h1" });
      for (const l of text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")) blocks.push({ text: l.trim() ? l : " ", style: "p" });
      const bytes = await blocksToPdf(blocks);
      setOut({ bytes, pages: (await PDFDocument.load(bytes)).getPageCount() });
    } catch { setError("Could not make the PDF."); }
  };
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".txt,text/plain" value={text} onChange={(v, n) => { setText(v); setOut(null); if (n) setName(n.replace(/\.[^.]+$/, "")); }} label="Text" placeholder="Type or paste your text here…" />
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div><label className="label" htmlFor="ttl">Title (optional)</label><input id="ttl" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <button className="btn w-full" disabled={!text.trim()} onClick={make}>Make PDF</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {out && <div className="space-y-2 border-t pt-3"><p className="text-sm" data-done="1">PDF ready: {out.pages} page{out.pages === 1 ? "" : "s"} · {formatBytes(out.bytes.length)}</p><button className="btn w-full" onClick={() => download(out.bytes, `${name}.pdf`, "application/pdf")}>Download PDF</button></div>}
      </div>
      <p className="text-xs text-neutral-500">Plain A4 pages in a standard font. Letters outside the Latin alphabet (for example Hindi or Malayalam) cannot be drawn and are replaced with a question mark.</p>
    </div>
  );
}
