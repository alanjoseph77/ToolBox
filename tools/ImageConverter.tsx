"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, formatBytes, loadImage } from "@/lib/files";

const targets = [
  { type: "image/jpeg", ext: "jpg", label: "JPG" },
  { type: "image/png", ext: "png", label: "PNG" },
  { type: "image/webp", ext: "webp", label: "WebP" },
];

export default function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [target, setTarget] = useState(targets[0]);
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; size: number }[]>([]);

  const run = async () => {
    setBusy(true); setDone([]);
    const out: { name: string; size: number }[] = [];
    for (const f of files) {
      const img = await loadImage(f);
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      if (target.type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); } // JPG has no transparency
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(c, target.type, quality / 100);
      const name = f.name.replace(/\.[^.]+$/, "") + "." + target.ext;
      download(blob, name); out.push({ name, size: blob.size });
      await new Promise((r) => setTimeout(r, 250));
    }
    setDone(out); setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={(f) => setFiles(f.filter((x) => x.type.startsWith("image/")))} />
      {files.length > 0 && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{files.length} image{files.length > 1 ? "s" : ""} selected</p>
          <div className="flex gap-2">{targets.map((t) => <button key={t.ext} className={t === target ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setTarget(t)}>{t.label}</button>)}</div>
          {target.type !== "image/png" && <div><label className="label">Quality: {quality}%</label><input type="range" min={30} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full" /></div>}
          <button className="btn w-full" disabled={busy} onClick={run}>{busy ? "Converting…" : `Convert to ${target.label}`}</button>
          {done.map((d) => <p key={d.name} className="text-sm text-neutral-600">✓ {d.name} · {formatBytes(d.size)}</p>)}
        </div>
      )}
    </div>
  );
}
