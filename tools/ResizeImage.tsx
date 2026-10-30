"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";

const presets = [
  { label: "Passport (35×45 mm @300dpi)", w: 413, h: 531 },
  { label: "Exam photo (200×230)", w: 200, h: 230 },
  { label: "Signature (140×60)", w: 140, h: 60 },
  { label: "Instagram square (1080)", w: 1080, h: 1080 },
];

export default function ResizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [orig, setOrig] = useState({ w: 0, h: 0 });
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState("image/jpeg");

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    const img = await loadImage(f[0]);
    setFile(f[0]); setOrig({ w: img.width, h: img.height }); setW(img.width); setH(img.height);
  };
  const changeW = (v: number) => { setW(v); if (lock && orig.w) setH(Math.round((v * orig.h) / orig.w)); };
  const changeH = (v: number) => { setH(v); if (lock && orig.h) setW(Math.round((v * orig.w) / orig.h)); };

  const run = async () => {
    const img = await loadImage(file!);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    if (format === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const ext = format.split("/")[1].replace("jpeg", "jpg");
    download(await canvasToBlob(c, format, 0.92), `resized.${ext}`);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={pick} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">Original: {orig.w} × {orig.h}px</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.label} className="btn-ghost !py-1.5 !text-xs" onClick={() => { setLock(false); setW(p.w); setH(p.h); }}>{p.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Width (px)</label><input type="number" min={1} className="input" value={w} onChange={(e) => changeW(Math.max(1, +e.target.value || 1))} /></div>
            <div><label className="label">Height (px)</label><input type="number" min={1} className="input" value={h} onChange={(e) => changeH(Math.max(1, +e.target.value || 1))} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Keep aspect ratio</label>
          <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option>
          </select>
          <button className="btn w-full" onClick={run}>Resize &amp; download</button>
        </div>
      )}
    </div>
  );
}
