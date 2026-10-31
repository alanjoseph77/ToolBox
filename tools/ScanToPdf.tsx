"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, RotateCw, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { applyScanFilter, buildScanPdf, type ScanFilter } from "@/lib/rasterPdf";

interface Item { id: number; file: File; rot: number; thumb: string }
let counter = 0;
const filters: { id: ScanFilter; label: string }[] = [{ id: "bw", label: "Black & white" }, { id: "enhance", label: "Enhance colour" }, { id: "gray", label: "Grayscale" }, { id: "original", label: "Original" }];

async function process(file: File, rot: number, filter: ScanFilter, maxSide: number): Promise<HTMLCanvasElement> {
  const img = await loadImage(file);
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * k), h = Math.round(img.height * k), turn = rot % 2 === 1;
  const c = document.createElement("canvas"); c.width = turn ? h : w; c.height = turn ? w : h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.translate(c.width / 2, c.height / 2); g.rotate((rot * Math.PI) / 2); g.drawImage(img, -w / 2, -h / 2, w, h);
  applyScanFilter(c, filter);
  return c;
}

export default function ScanToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ScanFilter>("bw");
  const [a4, setA4] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const token = useRef(0);

  // keep thumbnails in step with the chosen filter and rotation
  useEffect(() => {
    const mine = ++token.current;
    (async () => {
      const next: Item[] = [];
      let failed = false;
      for (const it of items) {
        try { const c = await process(it.file, it.rot, filter, 360); next.push({ ...it, thumb: c.toDataURL("image/jpeg", 0.7) }); }
        catch { failed = true; } // damaged picture: left out of the list below
        if (mine !== token.current) return;
      }
      if (failed && mine === token.current) { setError("A photo could not be read, so it was removed."); setItems(next); return; }
      if (mine === token.current && next.some((n, i) => n.thumb !== items[i]?.thumb)) setItems(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, items.map((i) => `${i.id}:${i.rot}`).join()]);

  const add = (files: File[]) => setItems((p) => [...p, ...files.filter((f) => f.type.startsWith("image/")).map((file) => ({ id: ++counter, file, rot: 0, thumb: "" }))]);
  const move = (i: number, d: number) => setItems((p) => { const j = i + d; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const build = async () => {
    setBusy(true); setError("");
    try {
      const pages = [];
      for (const it of items) {
        const c = await process(it.file, it.rot, filter, 2400);
        pages.push({ jpeg: new Uint8Array(await (await canvasToBlob(c, "image/jpeg", 0.85)).arrayBuffer()), w: (c.width * 72) / 200, h: (c.height * 72) / 200 });
      }
      download(await buildScanPdf(pages, a4), "scan.pdf", "application/pdf");
    } catch { setError("Could not create the PDF from these photos."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={add} hint="Take photos of your pages (on a phone you can use the camera) or choose existing ones." />
      {items.length > 0 && (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          <div><p className="label">Scan look</p><div className="flex flex-wrap gap-2">{filters.map((f) => <button key={f.id} className={f.id === filter ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setFilter(f.id)}>{f.label}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it, i) => (
              <div key={it.id} className="space-y-1 rounded-lg border p-2">
                <div className="flex h-36 items-center justify-center overflow-hidden rounded bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.thumb ? <img src={it.thumb} alt={`Page ${i + 1}`} className="max-h-full max-w-full" /> : <span className="text-xs text-neutral-400">Preparing…</span>}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button aria-label="Move earlier" className="btn-ghost !min-h-0 !px-0 !py-1" onClick={() => move(i, -1)}><ArrowUp className="mx-auto h-4 w-4" /></button>
                  <button aria-label="Move later" className="btn-ghost !min-h-0 !px-0 !py-1" onClick={() => move(i, 1)}><ArrowDown className="mx-auto h-4 w-4" /></button>
                  <button aria-label="Rotate" className="btn-ghost !min-h-0 !px-0 !py-1" onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, rot: (x.rot + 1) % 4 } : x)))}><RotateCw className="mx-auto h-4 w-4" /></button>
                  <button aria-label="Remove page" className="btn-ghost !min-h-0 !px-0 !py-1" onClick={() => setItems(items.filter((x) => x.id !== it.id))}><X className="mx-auto h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a4} onChange={(e) => setA4(e.target.checked)} /> Fit each page on A4</label>
          <button className="btn w-full" disabled={busy} onClick={build}>{busy ? "Creating…" : `Create PDF (${items.length} page${items.length === 1 ? "" : "s"})`}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <WaterLoader active={busy} label="Cleaning up and building your scan…" />
        </div>
      )}
    </div>
  );
}
