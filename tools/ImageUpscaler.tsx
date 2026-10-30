"use client";
import { useState } from "react";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, formatBytes, loadImage } from "@/lib/files";

const MAX_PIXELS = 40_000_000;

/** 3x3 sharpening convolution (strength 0 = off). */
function sharpen(c: HTMLCanvasElement, amount: number) {
  if (amount <= 0) return;
  const g = c.getContext("2d")!, src = g.getImageData(0, 0, c.width, c.height), dst = g.createImageData(c.width, c.height);
  const W = c.width, H = c.height, s = src.data, d = dst.data, k = amount;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) {
      const v = s[i + ch], up = y > 0 ? s[i - W * 4 + ch] : v, dn = y < H - 1 ? s[i + W * 4 + ch] : v, lf = x > 0 ? s[i - 4 + ch] : v, rt = x < W - 1 ? s[i + 4 + ch] : v;
      d[i + ch] = v * (1 + 4 * k) - k * (up + dn + lf + rt);
    }
    d[i + 3] = s[i + 3];
  }
  g.putImageData(dst, 0, 0);
}

export default function ImageUpscaler() {
  const [file, setFile] = useState<File | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [factor, setFactor] = useState(2);
  const [sharp, setSharp] = useState(0.4);
  const [out, setOut] = useState<{ blob: Blob; w: number; h: number; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    const img = await loadImage(f[0]); setFile(f[0]); setDims({ w: img.width, h: img.height }); setOut(null); setError("");
  };

  const tooBig = dims.w * dims.h * factor * factor > MAX_PIXELS;

  const run = async () => {
    setBusy(true); setError(""); setOut(null);
    try {
      const img = await loadImage(file!);
      // Step up in 2x stages: repeated smooth resampling keeps edges cleaner than one big jump.
      let cur: CanvasImageSource = img, w = img.width, h = img.height;
      const tw = img.width * factor, th = img.height * factor;
      while (w < tw || h < th) {
        const nw = Math.min(tw, w * 2), nh = Math.min(th, h * 2);
        const c = document.createElement("canvas"); c.width = Math.round(nw); c.height = Math.round(nh);
        const g = c.getContext("2d")!; g.imageSmoothingQuality = "high"; g.drawImage(cur, 0, 0, c.width, c.height);
        cur = c; w = c.width; h = c.height;
        await new Promise((r) => setTimeout(r, 0));
      }
      const final = cur as HTMLCanvasElement;
      sharpen(final, sharp);
      const blob = await canvasToBlob(final, "image/png");
      setOut({ blob, w: final.width, h: final.height, url: URL.createObjectURL(blob) });
    } catch { setError("This image is too large to process on this device. Try a smaller factor."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={pick} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{dims.w}×{dims.h}px → <b>{dims.w * factor}×{dims.h * factor}px</b></p>
          <div className="flex gap-2">{[2, 3, 4].map((f) => <button key={f} className={f === factor ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setFactor(f)}>{f}×</button>)}</div>
          <div><label className="label">Sharpening: {Math.round(sharp * 100)}%</label><input type="range" min={0} max={1} step={0.05} value={sharp} onChange={(e) => setSharp(+e.target.value)} className="w-full" /></div>
          {tooBig && <p className="text-sm text-neutral-700">That would exceed 40 megapixels. Choose a smaller factor.</p>}
          <button className="btn w-full" disabled={busy || tooBig} onClick={run}>{busy ? "Upscaling…" : "Upscale"}</button>
          <WaterLoader active={busy} label="Upscaling your image…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {out && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={out.url} alt="Upscaled" className="max-h-80 rounded border" />
              <p className="text-sm">{out.w}×{out.h}px · {formatBytes(out.blob.size)}</p>
              <button className="btn w-full" onClick={() => download(out.blob, "upscaled.png")}>Download PNG</button>
            </div>
          )}
          <p className="text-xs text-neutral-500">Uses high-quality resampling plus sharpening. It enlarges cleanly but can&apos;t invent detail the way a neural upscaler does.</p>
        </div>
      )}
    </div>
  );
}
