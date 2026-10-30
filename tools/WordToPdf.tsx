"use client";
import { useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { Block, blocksToPdf } from "@/lib/textPdf";

function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: Block[] = [];
  doc.body.childNodes.forEach((n) => {
    const el = n as HTMLElement, tag = el.tagName?.toLowerCase();
    if (!tag) return;
    if (/^h[1-3]$/.test(tag)) out.push({ text: el.textContent ?? "", style: tag as Block["style"] });
    else if (tag === "ul" || tag === "ol") el.querySelectorAll("li").forEach((li) => out.push({ text: li.textContent ?? "", style: "li" }));
    else if (tag === "table") el.querySelectorAll("tr").forEach((tr) => out.push({ text: Array.from(tr.children).map((c) => c.textContent).join("  |  "), style: "p" }));
    else if (el.textContent?.trim()) out.push({ text: el.textContent, style: "p" });
  });
  return out;
}

export default function WordToPdf() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const run = async (f: File) => {
    setError(""); setStatus("Converting…");
    try {
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      const blocks = htmlToBlocks(value);
      if (!blocks.length) throw new Error("empty");
      download(await blocksToPdf(blocks), f.name.replace(/\.docx$/i, "") + ".pdf", "application/pdf");
      setStatus("Done. Your PDF was downloaded.");
    } catch { setError("Could not convert this file. Only .docx files are supported (not older .doc)."); setStatus(""); }
  };

  return (
    <div className="space-y-4">
      <Dropzone accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onFiles={(f) => f[0] && run(f[0])} hint="Upload a .docx file. It stays on your device." />
      {status && <p className="text-sm text-neutral-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-500">Keeps headings, paragraphs, lists and table text. Fonts, images and exact layout are not preserved, and non-Latin scripts are not supported yet.</p>
    </div>
  );
}
