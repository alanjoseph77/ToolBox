"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { JobStatus, PartsList, useJob, type Part } from "@/components/PdfShell";
import { canvasToBlob, formatBytes, loadImage } from "@/lib/files";

type Out = "jpeg" | "png";

/** Safari decodes HEIC itself; everywhere else a WebAssembly decoder (heic2any) does the work. */
async function toImageBlob(file: File, out: Out, quality: number): Promise<Blob> {
  const mime = out === "png" ? "image/png" : "image/jpeg";
  try {
    const img = await loadImage(file); // works when the browser understands HEIC natively
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!; if (out === "jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
    g.drawImage(img, 0, 0);
    return await canvasToBlob(c, mime, quality);
  } catch { /* fall through to the WebAssembly decoder */ }
  const heic2any = (await import("heic2any")).default;
  const res = await heic2any({ blob: file, toType: mime, quality });
  return Array.isArray(res) ? res[0] : res;
}

export default function HeicToJpg() {
  const [out, setOut] = useState<Out>("jpeg");
  const [quality, setQuality] = useState(90);
  const [parts, setParts] = useState<(Part & { info: string })[]>([]);
  const { busy, error, run } = useJob();

  const convert = (files: File[]) => run(async () => {
    const heics = files.filter((f) => /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type));
    if (!heics.length) throw new Error("Please choose .heic or .heif photos.");
    const res: (Part & { info: string })[] = [];
    for (const f of heics) {
      const blob = await toImageBlob(f, out, quality / 100);
      res.push({ name: f.name.replace(/\.[^.]+$/, "") + (out === "png" ? ".png" : ".jpg"), bytes: new Uint8Array(await blob.arrayBuffer()), type: blob.type, info: `${f.name} (${formatBytes(f.size)}) → ${formatBytes(blob.size)}` });
    }
    setParts(res);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex gap-2">{(["jpeg", "png"] as Out[]).map((o) => <button key={o} className={o === out ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setOut(o)}>{o === "jpeg" ? "JPG" : "PNG"}</button>)}</div>
        {out === "jpeg" && <div><label className="label">Quality: {quality}%</label><input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full" /></div>}
      </div>
      <Dropzone accept=".heic,.heif,image/heic,image/heif" multiple onFiles={convert} hint="iPhone photos (.heic). Converted on your device, never uploaded." />
      <JobStatus busy={busy} error={error} label="Converting your photos…" />
      {parts.length > 0 && <ul className="space-y-1 text-sm text-neutral-600">{parts.map((p) => <li key={p.name}>✓ {p.info}</li>)}</ul>}
      <PartsList parts={parts} zipName="converted-photos.zip" />
    </div>
  );
}
