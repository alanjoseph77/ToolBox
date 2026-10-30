"use client";
import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import { download, loadImage } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState("");
  const [sig, setSig] = useState("");
  const [place, setPlace] = useState<{ fx: number; fy: number } | null>(null);
  const [size, setSize] = useState(25); // signature width as % of page width
  const [error, setError] = useState("");
  const pad = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const load = async (f: File) => {
    setError(""); setPlace(null);
    try {
      const pdf = await openPdf(f);
      setFile(f); setPdfDoc(pdf); setPageCount(pdf.numPages); setPage(1);
    } catch { setError("Could not open this PDF."); }
  };

  useEffect(() => {
    if (!pdfDoc) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderPage(pdfDoc as any, page, 1.2).then((c) => setPreview(c.toDataURL("image/jpeg", 0.85)));
  }, [pdfDoc, page]);

  const padPos = (e: React.PointerEvent) => {
    const c = pad.current!, b = c.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height };
  };
  const padDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true;
    const g = pad.current!.getContext("2d")!, p = padPos(e);
    g.lineWidth = 3; g.lineCap = "round"; g.strokeStyle = "#111"; g.beginPath(); g.moveTo(p.x, p.y);
  };
  const padMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const g = pad.current!.getContext("2d")!, p = padPos(e); g.lineTo(p.x, p.y); g.stroke();
  };
  const padUp = () => { if (drawing.current) { drawing.current = false; setSig(pad.current!.toDataURL("image/png")); } };
  const clearPad = () => { pad.current!.getContext("2d")!.clearRect(0, 0, 600, 200); setSig(""); };

  const upload = async (f: File[]) => {
    if (!f[0]) return;
    const img = await loadImage(f[0]);
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    c.getContext("2d")!.drawImage(img, 0, 0); setSig(c.toDataURL("image/png"));
  };

  const apply = async () => {
    const doc = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
    const target = doc.getPage(page - 1);
    const { width: W, height: H } = target.getSize();
    const img = await doc.embedPng(sig);
    const w = (size / 100) * W, h = (img.height / img.width) * w;
    target.drawImage(img, { x: place!.fx * W - w / 2, y: H - place!.fy * H - h / 2, width: w, height: h });
    download(await doc.save(), file!.name.replace(/\.pdf$/i, "") + "-signed.pdf", "application/pdf");
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && load(f[0])} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {file && (
        <>
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <p className="label">1. Your signature</p>
            <canvas ref={pad} width={600} height={200} className="w-full touch-none rounded-lg border bg-slate-50"
              onPointerDown={padDown} onPointerMove={padMove} onPointerUp={padUp} />
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-ghost !py-1.5" onClick={clearPad}>Clear</button>
              <label className="btn-ghost !py-1.5 cursor-pointer">Upload image<input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => upload(Array.from(e.target.files ?? []))} /></label>
              {sig && <span className="text-sm text-green-700">✓ Signature ready</span>}
            </div>
          </div>
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <p className="label">2. Tap where it should go</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label>Page <select className="input !w-24" value={page} onChange={(e) => { setPage(+e.target.value); setPlace(null); }}>
                {Array.from({ length: pageCount }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              <label className="flex items-center gap-2">Size <input type="range" min={8} max={60} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
            </div>
            {preview && (
              <div className="relative inline-block max-w-full cursor-crosshair select-none"
                onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); setPlace({ fx: (e.clientX - b.left) / b.width, fy: (e.clientY - b.top) / b.height }); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={`Page ${page}`} className="max-w-full rounded border" draggable={false} />
                {place && sig && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sig} alt="" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${place.fx * 100}%`, top: `${place.fy * 100}%`, width: `${size}%` }} />
                )}
              </div>
            )}
          </div>
          <button className="btn w-full" disabled={!sig || !place} onClick={apply}>Sign &amp; download</button>
        </>
      )}
    </div>
  );
}
