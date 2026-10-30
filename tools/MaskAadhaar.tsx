"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { findAadhaarBoxes, type Box, type Word } from "@/lib/aadhaar";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { jpegPagesToPdf } from "@/lib/pdfOps";
import { openPdf, renderPage } from "@/lib/pdfjs";
import { createOcr } from "@/lib/tesseract";

interface Page { canvas: HTMLCanvasElement; url: string; boxes: Box[]; autoCount: number; widthPt: number; heightPt: number }
const MAX_SIDE = 2400;

export default function MaskAadhaar() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isPdf, setIsPdf] = useState(false);
  const [name, setName] = useState("");
  const [cur, setCur] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);

  const load = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setError(""); setPages([]); setCur(0); setName(f.name); setBusy(true);
    try {
      const canvases: { c: HTMLCanvasElement; wPt: number; hPt: number }[] = [];
      if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
        setIsPdf(true); setStatus("Opening your PDF…");
        const pdf = await openPdf(f);
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { const v = (await pdf.getPage(i)).getViewport({ scale: 1 }); canvases.push({ c: await renderPage(pdf, i, 2), wPt: v.width, hPt: v.height }); }
      } else {
        setIsPdf(false);
        const img = await loadImage(f), k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        canvases.push({ c, wPt: c.width, hPt: c.height });
      }
      const worker = await createOcr("eng");
      const out: Page[] = [];
      for (let i = 0; i < canvases.length; i++) {
        setStatus(`Reading page ${i + 1} of ${canvases.length}…`);
        const { data } = await worker.recognize(canvases[i].c);
        const words: Word[] = (data.words ?? []).map((w: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({ text: w.text, ...w.bbox }));
        const boxes = findAadhaarBoxes(words);
        out.push({ canvas: canvases[i].c, url: canvases[i].c.toDataURL("image/jpeg", 0.8), boxes, autoCount: boxes.length, widthPt: canvases[i].wPt, heightPt: canvases[i].hPt });
      }
      await worker.terminate();
      setPages(out);
    } catch { setError("Could not read this file. Try a clearer photo or scan."); }
    setStatus(""); setBusy(false);
  };

  const page = pages[cur];
  const frac = (e: React.PointerEvent) => { const b = area.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) }; };
  const setBoxes = (boxes: Box[]) => setPages((p) => p.map((x, i) => (i === cur ? { ...x, boxes } : x)));
  const total = pages.reduce((n, p) => n + p.boxes.length, 0);
  const autoTotal = pages.reduce((n, p) => n + p.autoCount, 0);

  const save = async () => {
    setBusy(true); setStatus("Masking…");
    try {
      const jpegs: { jpeg: Uint8Array; widthPt: number; heightPt: number }[] = [];
      for (const p of pages) {
        const c = document.createElement("canvas"); c.width = p.canvas.width; c.height = p.canvas.height;
        const g = c.getContext("2d")!; g.drawImage(p.canvas, 0, 0); g.fillStyle = "#000";
        p.boxes.forEach((b) => g.fillRect(b.x, b.y, b.w, b.h));
        const blob = await canvasToBlob(c, isPdf ? "image/jpeg" : "image/png", 0.92);
        if (!isPdf) { download(blob, name.replace(/\.[^.]+$/, "") + "-masked.png"); setBusy(false); setStatus(""); return; }
        jpegs.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), widthPt: p.widthPt, heightPt: p.heightPt });
      }
      download(await jpegPagesToPdf(jpegs), name.replace(/\.pdf$/i, "") + "-masked.pdf", "application/pdf");
    } catch { setError("Could not save the masked file."); }
    setBusy(false); setStatus("");
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*,application/pdf" onFiles={load} hint="Photo, scan or PDF of an Aadhaar card. The text is read on your device and nothing is uploaded." />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <WaterLoader active={busy} label={status || "Working…"} hints={["Reading the numbers on your device", "Nothing is uploaded", "Almost there…"]} />
      {page && !busy && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold">{autoTotal ? `Found ${autoTotal} Aadhaar number${autoTotal === 1 ? "" : "s"}. The first 8 digits are covered.` : "No Aadhaar number was found automatically. Drag boxes over the digits you want to hide."}</p>
          {pages.length > 1 && (
            <div className="flex items-center justify-between">
              <button aria-label="Previous page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={cur === 0} onClick={() => setCur(cur - 1)}><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm">Page {cur + 1} of {pages.length}</span>
              <button aria-label="Next page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={cur >= pages.length - 1} onClick={() => setCur(cur + 1)}><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
          <div ref={area} className="relative mx-auto w-full max-w-xl touch-none select-none overflow-hidden rounded-lg border"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = frac(e); }}
            onPointerMove={(e) => { if (start.current) { const a = start.current, b = frac(e); setDrag({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }); } }}
            onPointerUp={() => { if (start.current && drag && drag.w > 0.01 && drag.h > 0.005) setBoxes([...page.boxes, { x: drag.x * page.canvas.width, y: drag.y * page.canvas.height, w: drag.w * page.canvas.width, h: drag.h * page.canvas.height }]); start.current = null; setDrag(null); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.url} alt={`Page ${cur + 1}`} draggable={false} className="block w-full" />
            {page.boxes.map((b, i) => <div key={i} data-mask="1" className="absolute bg-black" style={{ left: `${(b.x / page.canvas.width) * 100}%`, top: `${(b.y / page.canvas.height) * 100}%`, width: `${(b.w / page.canvas.width) * 100}%`, height: `${(b.h / page.canvas.height) * 100}%` }} />)}
            {drag && <div className="absolute bg-black/70" style={{ left: `${drag.x * 100}%`, top: `${drag.y * 100}%`, width: `${drag.w * 100}%`, height: `${drag.h * 100}%` }} />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" disabled={!page.boxes.length} onClick={() => setBoxes(page.boxes.slice(0, -1))}>Undo last box</button>
            <button className="btn-ghost" disabled={!page.boxes.length} onClick={() => setBoxes([])}>Clear boxes</button>
          </div>
          <button className="btn w-full" onClick={save}>{`Download masked ${isPdf ? "PDF" : "image"} (${total} box${total === 1 ? "" : "es"})`}</button>
          <p className="flex items-start gap-2 text-xs text-neutral-500"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Always look at the result before you share it. Automatic reading can miss digits on blurry photos. Covered areas are permanently blacked out in the saved file.</p>
        </div>
      )}
    </div>
  );
}
