"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PdfShell, { JobStatus, outName, useJob, type PdfFile } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { openPdfBytes, renderPage } from "@/lib/pdfjs";
import { redactPages, type Rect } from "@/lib/rasterPdf";

function Redactor({ f }: { f: PdfFile }) {
  const [page, setPage] = useState(0);
  const [img, setImg] = useState("");
  const [rects, setRects] = useState<Record<number, Rect[]>>({});
  const [drag, setDrag] = useState<Rect | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const { busy, error, run } = useJob();

  useEffect(() => { setRects({}); setPage(0); }, [f.id]);
  useEffect(() => {
    let live = true;
    openPdfBytes(f.bytes).then((pdf) => renderPage(pdf, page + 1, 1.3)).then((c) => { if (live) setImg(c.toDataURL("image/jpeg", 0.85)); });
    return () => { live = false; };
  }, [f.id, f.bytes, page]);

  const pos = (e: React.PointerEvent) => {
    const b = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) };
  };
  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
  const current = rects[page] ?? [];
  const total = Object.values(rects).reduce((n, r) => n + r.length, 0);
  const pagesHit = Object.entries(rects).filter(([, r]) => r.length).length;

  return (
    <>
      <p className="text-sm text-neutral-600">Drag over anything you want to black out. Pages with black boxes are flattened to images, so the covered text is really removed.</p>
      <div className="flex items-center justify-between gap-2">
        <button aria-label="Previous page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm">Page {page + 1} of {f.pages}{current.length ? ` · ${current.length} box${current.length === 1 ? "" : "es"}` : ""}</span>
        <button aria-label="Next page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={page >= f.pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div ref={box} className="relative mx-auto w-full max-w-lg touch-none select-none overflow-hidden rounded-lg border bg-white"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = pos(e); }}
        onPointerMove={(e) => { if (start.current) setDrag(norm(start.current, pos(e))); }}
        onPointerUp={() => { if (start.current && drag && drag.w > 0.005 && drag.h > 0.005) setRects((r) => ({ ...r, [page]: [...(r[page] ?? []), drag] })); start.current = null; setDrag(null); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img} alt={`Page ${page + 1}`} draggable={false} className="block w-full" /> : <div className="h-96" />}
        {[...current, ...(drag ? [drag] : [])].map((r, i) => <div key={i} className="absolute bg-black" style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }} />)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost" disabled={!current.length} onClick={() => setRects({ ...rects, [page]: current.slice(0, -1) })}>Undo last box</button>
        <button className="btn-ghost" disabled={!total} onClick={() => setRects({})}>Clear all</button>
      </div>
      <button className="btn w-full" disabled={busy || !total} onClick={() => run(async () => download(await redactPages(f.bytes, Object.fromEntries(Object.entries(rects).map(([k, v]) => [+k, v]))), outName(f.name, "-redacted"), "application/pdf"))}>
        {busy ? "Redacting…" : `Redact ${total} box${total === 1 ? "" : "es"} on ${pagesHit} page${pagesHit === 1 ? "" : "s"}`}
      </button>
      <JobStatus busy={busy} error={error} label="Blacking out and flattening pages…" />
    </>
  );
}

export default function RedactPdf() {
  return <PdfShell hint="Everything stays on your device.">{([f]) => <Redactor f={f} />}</PdfShell>;
}
