"use client";
import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";

interface Item { src: number; rot: number; thumb: string }

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (f: File) => {
    setBusy(true); setError(""); setItems([]); setFile(f);
    try {
      const pdf = await openPdf(f);
      const out: Item[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        out.push({ src: i - 1, rot: 0, thumb: (await renderPage(pdf, i, 0.35)).toDataURL("image/jpeg", 0.7) });
        setItems([...out]);
      }
    } catch { setError("Could not open this PDF. It may be encrypted or damaged."); }
    setBusy(false);
  };

  const update = (i: number, fn: (it: Item) => Item) => setItems(items.map((it, k) => (k === i ? fn(it) : it)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n);
  };

  const save = async () => {
    const src = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, items.map((it) => it.src));
    pages.forEach((p, i) => {
      p.setRotation(degrees((p.getRotation().angle + items[i].rot) % 360));
      out.addPage(p);
    });
    download(await out.save(), "organized.pdf", "application/pdf");
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => f[0] && load(f[0])} />
      {busy && <p className="text-sm text-neutral-500">Loading pages…</p>}
      <WaterLoader active={busy} label="Generating page previews…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it, i) => (
              <div key={it.src} className="space-y-1 rounded-xl border bg-white p-2">
                <div className="flex h-36 items-center justify-center overflow-hidden rounded bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.thumb} alt={`Page ${it.src + 1}`} className="max-h-full max-w-full transition" style={{ transform: `rotate(${it.rot}deg)` }} />
                </div>
                <p className="text-center text-xs text-neutral-500">Page {it.src + 1}</p>
                <div className="grid grid-cols-4 gap-1">
                  <button aria-label="Move earlier" className="btn-ghost !px-0 !py-1" onClick={() => move(i, -1)}>←</button>
                  <button aria-label="Move later" className="btn-ghost !px-0 !py-1" onClick={() => move(i, 1)}>→</button>
                  <button aria-label="Rotate" className="btn-ghost !px-0 !py-1" onClick={() => update(i, (x) => ({ ...x, rot: (x.rot + 90) % 360 }))}>⟳</button>
                  <button aria-label="Delete page" className="btn-ghost !px-0 !py-1" onClick={() => setItems(items.filter((_, k) => k !== i))}>🗑</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn w-full" disabled={busy} onClick={save}>Save PDF ({items.length} pages)</button>
        </>
      )}
    </div>
  );
}
