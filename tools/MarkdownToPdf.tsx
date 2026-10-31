"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import PasteOrFile from "@/components/PasteOrFile";
import { download, formatBytes } from "@/lib/files";
import { mdToBlocks } from "@/lib/markdown";
import { blocksToPdf } from "@/lib/textPdf";

const SAMPLE = "# My notes\n\nSome **bold** text and a [link](https://example.com).\n\n## Things to do\n\n- Write the report\n- Send the invoice\n\n1. First\n2. Second\n";

export default function MarkdownToPdf() {
  const [text, setText] = useState(SAMPLE);
  const [name, setName] = useState("document");
  const [out, setOut] = useState<{ bytes: Uint8Array; pages: number } | null>(null);
  const [error, setError] = useState("");
  const make = async () => {
    setError(""); setOut(null);
    try { const bytes = await blocksToPdf(mdToBlocks(text)); setOut({ bytes, pages: (await PDFDocument.load(bytes)).getPageCount() }); } catch { setError("Could not make the PDF."); }
  };
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".md,.markdown,.txt,text/markdown,text/plain" value={text} onChange={(v, n) => { setText(v); setOut(null); if (n) setName(n.replace(/\.[^.]+$/, "")); }} label="Markdown" placeholder="# Title" />
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <button className="btn w-full" disabled={!text.trim()} onClick={make}>Make PDF</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {out && <div className="space-y-2 border-t pt-3"><p className="text-sm" data-done="1">PDF ready: {out.pages} page{out.pages === 1 ? "" : "s"} · {formatBytes(out.bytes.length)}</p><button className="btn w-full" onClick={() => download(out.bytes, `${name}.pdf`, "application/pdf")}>Download PDF</button></div>}
      </div>
      <p className="text-xs text-neutral-500">Headings, paragraphs, bullet and numbered lists, bold, links and code blocks are supported. Tables and images are not drawn.</p>
    </div>
  );
}
