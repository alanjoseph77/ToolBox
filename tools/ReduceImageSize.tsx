"use client";
import { useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, formatBytes, loadImage } from "@/lib/files";
import { jpegWithinKb } from "@/lib/photoSize";

const PRESETS = [10, 20, 30, 50, 100, 200, 500, 1024];

export default function ReduceImageSize() {
  const file = useRef<File | null>(null);
  const [kb, setKb] = useState(50);
  const [out, setOut] = useState<{ blob: Blob; w: number; h: number; url: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (f: File, target = kb) => {
    setBusy(true); setError("");
    try {
      const img = await loadImage(f);
      let w = img.width, h = img.height, res = null as Awaited<ReturnType<typeof jpegWithinKb>> | null, c!: HTMLCanvasElement;
      for (let i = 0; i < 14; i++) {                       // keep the pixel size if quality stays good, else shrink a little and retry
        c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
        res = await jpegWithinKb(c, target);
        if (res.reached && res.quality >= 0.45) break;
        if (Math.min(w, h) <= 60) break;
        w = Math.round(w * 0.85); h = Math.round(h * 0.85);
      }
      const r = res!; setOut({ blob: r.blob, w: c.width, h: c.height, url: URL.createObjectURL(r.blob), ok: r.reached });
    } catch { setError("Could not read this image."); setOut(null); }
    setBusy(false);
  };
  const pick = (n: number) => { setKb(n); if (file.current) run(file.current, n); };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="label">Make the file smaller than</label>
        <div className="flex flex-wrap gap-2">{PRESETS.map((n) => <button key={n} disabled={busy} className={kb === n ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => pick(n)}>{n >= 1024 ? "1 MB" : `${n} KB`}</button>)}</div>
        <div className="flex items-center gap-2"><input aria-label="Custom KB" type="number" min={5} className="input w-28" value={kb} onChange={(e) => setKb(Math.max(5, +e.target.value))} /><span className="text-sm">KB</span>
          <button className="btn-ghost" disabled={!file.current || busy} onClick={() => file.current && run(file.current)}>Apply</button></div>
      </div>
      <Dropzone accept="image/*" onFiles={(f) => { file.current = f[0]; run(f[0]); }} hint="Works with JPG, PNG, WebP and HEIC photos. The result is a JPG." />
      {busy && <p className="text-sm text-neutral-500">Reducing…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && !busy && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out.url} alt="Result" className="max-h-72 rounded-xl border" />
          <p className="text-sm" data-testid="kb-info">{out.w} × {out.h} px · <b>{formatBytes(out.blob.size)}</b> {out.ok ? "" : <span className="text-red-600">(could not reach {kb} KB, try a bigger limit)</span>}</p>
          <button className="btn w-full" onClick={() => download(out.blob, `reduced-${Math.round(out.blob.size / 1024)}kb.jpg`)}>Download JPG</button>
        </div>
      )}
    </div>
  );
}
