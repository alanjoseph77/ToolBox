"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, formatBytes, loadImage } from "@/lib/files";

const presets = [20, 50, 100, 200, 500];

/** Binary-searches JPEG quality, then scales down if quality alone can't reach the target. */
async function compressToTarget(file: File, targetBytes: number): Promise<Blob> {
  const img = await loadImage(file);
  let scale = 1;
  let best: Blob | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    let lo = 0.05, hi = 0.95, fit: Blob | null = null;
    for (let i = 0; i < 8; i++) {
      const q = (lo + hi) / 2;
      const b = await canvasToBlob(c, "image/jpeg", q);
      if (b.size <= targetBytes) { fit = b; lo = q; } else hi = q;
    }
    if (fit) { best = fit; break; }
    scale *= 0.8;
  }
  if (!best) throw new Error("Could not reach that size");
  return best;
}

export default function CompressImage() {
  const [file, setFile] = useState<File | null>(null);
  const [kb, setKb] = useState(100);
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!file) return;
    setBusy(true); setError(""); setOut(null);
    try { setOut(await compressToTarget(file, kb * 1024)); }
    catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={(f) => { setFile(f[0] ?? null); setOut(null); }} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{file.name} · {formatBytes(file.size)}</p>
          <label className="label">Target size (KB)</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p} onClick={() => setKb(p)} className={p === kb ? "btn !py-1.5" : "btn-ghost !py-1.5"}>{p} KB</button>
            ))}
            <input type="number" min={5} className="input !w-28" value={kb} onChange={(e) => setKb(Math.max(5, +e.target.value || 5))} />
          </div>
          <button className="btn w-full" disabled={busy} onClick={run}>{busy ? "Compressing…" : `Compress to ${kb} KB`}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {out && (
            <div className="space-y-2">
              <p className="text-sm">Result: <b>{formatBytes(out.size)}</b></p>
              <button className="btn w-full" onClick={() => download(out, "compressed.jpg")}>Download</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
