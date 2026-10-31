"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import PasteOrFile from "@/components/PasteOrFile";
import { canvasToBlob, download, formatBytes } from "@/lib/files";
import { htmlToCanvas } from "@/lib/htmlRender";
import { jpegPagesToPdf } from "@/lib/pdfOps";
import { blocksToPdf, type Block } from "@/lib/textPdf";

const SAMPLE = `<h1 style="font-family:sans-serif">Invoice 1024</h1>\n<p style="font-family:sans-serif;color:#444">Thank you for your business.</p>\n<table style="font-family:sans-serif;border-collapse:collapse"><tr><td style="border:1px solid #999;padding:6px">Design</td><td style="border:1px solid #999;padding:6px">₹5,000</td></tr></table>`;
const A4 = { w: 595.28, h: 841.89 };

function textBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html"), out: Block[] = [];
  doc.querySelectorAll("script,style").forEach((e) => e.remove());
  doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,tr,pre").forEach((el) => {
    const tag = el.tagName.toLowerCase(), t = tag === "tr" ? [...el.children].map((c) => c.textContent?.trim()).join("   ") : (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (t) out.push({ text: t, style: tag === "h1" ? "h1" : tag === "h2" ? "h2" : /^h\d$/.test(tag) ? "h3" : tag === "li" ? "li" : "p" });
  });
  if (!out.length && doc.body.textContent?.trim()) out.push({ text: doc.body.textContent.trim(), style: "p" });
  return out;
}

export default function HtmlToPdf() {
  const [html, setHtml] = useState(SAMPLE);
  const [mode, setMode] = useState<"look" | "text">("look");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  const make = async () => {
    setBusy(true); setError(""); setOut(null);
    try {
      let bytes: Uint8Array;
      if (mode === "text") bytes = await blocksToPdf(textBlocks(html));
      else {
        const WIDTH = 794, c = await htmlToCanvas(html, WIDTH, 2, "#ffffff"), pageH = Math.round(c.width * (A4.h / A4.w));
        const pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[] = [];
        for (let y = 0; y < c.height || !pages.length; y += pageH) {
          const s = document.createElement("canvas"); s.width = c.width; s.height = pageH;
          const g = s.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, s.width, s.height); g.drawImage(c, 0, y, c.width, Math.min(pageH, c.height - y), 0, 0, c.width, Math.min(pageH, c.height - y));
          pages.push({ jpeg: new Uint8Array(await (await canvasToBlob(s, "image/jpeg", 0.92)).arrayBuffer()), widthPt: A4.w, heightPt: A4.h });
        }
        bytes = await jpegPagesToPdf(pages);
      }
      setOut({ bytes, pages: (await PDFDocument.load(bytes)).getPageCount() });
    } catch { setError("Could not turn this HTML into a PDF. Check that the HTML is valid. Pictures and fonts from other websites are not loaded; use inline styles or data: images."); }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".html,.htm,text/html" value={html} onChange={(v) => { setHtml(v); setOut(null); }} label="Your HTML" placeholder="<h1>Hello</h1>" rows={12} />
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mode">
          <button aria-pressed={mode === "look"} className={mode === "look" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("look")}>Keep the look (pictures of the page)</button>
          <button aria-pressed={mode === "text"} className={mode === "text" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode("text")}>Text only (selectable)</button>
        </div>
        <button className="btn w-full" disabled={busy || !html.trim()} onClick={make}>{busy ? "Making PDF…" : "Make PDF"}</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {out && <div className="space-y-2 border-t pt-3"><p className="text-sm" data-done="1">PDF ready: {out.pages} page{out.pages === 1 ? "" : "s"} · {formatBytes(out.bytes.length)}</p><button className="btn w-full" onClick={() => download(out.bytes, "page.pdf", "application/pdf")}>Download PDF</button></div>}
      </div>
      <p className="text-xs text-neutral-500">Paste your own HTML and CSS. A web address does not work, because browsers block reading other sites. Keep the look draws the page as pictures, so the text cannot be selected, and a page break can fall through a line of text. Scripts are ignored.</p>
    </div>
  );
}
