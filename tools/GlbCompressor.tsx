"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";

export default function GlbCompressor() {
  const [maxTex, setMaxTex] = useState(1024);
  const [quality, setQuality] = useState(80);
  const [quant, setQuant] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<{ name: string; before: number; after: number; blob: Blob; tex: number } | null>(null);

  const run = async (f: File) => {
    setBusy(true); setError(""); setRes(null);
    try {
      const { WebIO } = await import("@gltf-transform/core"), { ALL_EXTENSIONS } = await import("@gltf-transform/extensions"), { dedup, prune, quantize, weld } = await import("@gltf-transform/functions");
      const io = new WebIO().registerExtensions(ALL_EXTENSIONS), doc = await io.readBinary(new Uint8Array(await f.arrayBuffer()));
      await doc.transform(dedup(), prune(), weld());
      if (quant) await doc.transform(quantize());
      let tex = 0;
      for (const t of doc.getRoot().listTextures()) {                               // shrink and re-encode the pictures: that is where most of the weight is
        const img = t.getImage(), mime = t.getMimeType(); if (!img || (mime !== "image/jpeg" && mime !== "image/png")) continue;
        const bmp = await createImageBitmap(new Blob([img as BlobPart], { type: mime })), k = Math.min(1, maxTex / Math.max(bmp.width, bmp.height));
        const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
        c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
        const b: Blob | null = await new Promise((r) => c.toBlob(r, mime, mime === "image/jpeg" ? quality / 100 : undefined));
        if (b && b.size < img.byteLength) { t.setImage(new Uint8Array(await b.arrayBuffer())); tex++; }
      }
      const out = await io.writeBinary(doc), blob = new Blob([out as BlobPart], { type: "model/gltf-binary" });
      setRes({ name: f.name.replace(/\.glb$/i, "") + "-small.glb", before: f.size, after: blob.size, blob, tex });
    } catch (e) { console.warn(e); setError("Could not compress this file. It must be a single .glb (not .gltf with separate files)."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 text-sm space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">Largest picture size <select className="rounded-lg border px-2 py-2" value={maxTex} onChange={(e) => setMaxTex(+e.target.value)}>{[4096, 2048, 1024, 512, 256].map((n) => <option key={n} value={n}>{n} px</option>)}</select></label>
          <label className="flex items-center gap-2">JPEG quality <input type="number" min={30} max={95} className="input w-20" value={quality} onChange={(e) => setQuality(Math.min(95, Math.max(30, +e.target.value)))} /></label>
          <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={quant} onChange={(e) => setQuant(e.target.checked)} /> Shrink mesh data (quantize)</label>
        </div>
        <p className="text-neutral-500">Most of a model&apos;s weight is its pictures (textures), so lowering their size saves the most. Set the options first, then add the file.</p>
      </div>
      <Dropzone accept=".glb" onFiles={(f) => run(f[0])} hint="A single .glb file. Opens on your device, nothing is uploaded." />
      <WaterLoader active={busy} label="Compressing the model…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {res && !busy && (
        <div className="space-y-3">
          <p className="text-sm" data-testid="glb-info">{formatBytes(res.before)} → <b>{formatBytes(res.after)}</b> ({Math.round((1 - res.after / res.before) * 100)}% smaller){res.tex ? ` · ${res.tex} picture${res.tex > 1 ? "s" : ""} shrunk` : ""}. Check it in the 3D Model Viewer before using it.</p>
          <button className="btn w-full" onClick={() => download(res.blob, res.name, "model/gltf-binary")}>Download {res.name}</button>
        </div>
      )}
    </div>
  );
}
