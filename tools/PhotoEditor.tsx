"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { applyAdjust, neutral, presets, type Adjust } from "@/lib/photoFilters";

const sliders: [keyof Adjust, string][] = [["brightness", "Brightness"], ["contrast", "Contrast"], ["saturation", "Colour"], ["warmth", "Warmth"]];

export default function PhotoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [a, setA] = useState<Adjust>(neutral);
  const [error, setError] = useState("");
  const view = useRef<HTMLCanvasElement>(null);

  const draw = (max: number) => {
    const k = max ? Math.min(1, max / Math.max(img!.width, img!.height)) : 1;
    const c = document.createElement("canvas"); c.width = Math.round(img!.width * k); c.height = Math.round(img!.height * k);
    const g = c.getContext("2d", { willReadFrequently: true })!; g.drawImage(img!, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height); applyAdjust(px, a); g.putImageData(px, 0, 0);
    return c;
  };
  useEffect(() => { const v = view.current; if (!v || !img) return; const c = draw(800); v.width = c.width; v.height = c.height; v.getContext("2d")!.drawImage(c, 0, 0); });

  const load = async (f: File[]) => { if (!f[0]) return; setError(""); try { setImg(await loadImage(f[0])); setFile(f[0]); setA(neutral); } catch { setError("Could not read this image."); } };
  const save = async () => { const jpg = file!.type === "image/jpeg"; download(await canvasToBlob(draw(0), jpg ? "image/jpeg" : "image/png", 0.95), file!.name.replace(/\.[^.]+$/, "") + "-edited." + (jpg ? "jpg" : "png")); };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={load} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {img && file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Looks">{Object.entries(presets).map(([n, p]) => <button key={n} className="btn-ghost !py-1.5 whitespace-nowrap" onClick={() => setA(p)}>{n}</button>)}</div>
          <canvas ref={view} aria-label="Edited preview" className="mx-auto block max-h-96 w-auto max-w-full rounded-lg border" />
          <div className="grid gap-3 sm:grid-cols-2">
            {sliders.map(([k, label]) => <label key={k} className="text-sm font-medium">{label}: {a[k] as number}<input type="range" min={-100} max={100} value={a[k] as number} onChange={(e) => setA({ ...a, [k]: +e.target.value })} className="w-full" aria-label={label} /></label>)}
          </div>
          <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={a.gray} onChange={(e) => setA({ ...a, gray: e.target.checked })} /> Black &amp; white</label><label className="flex items-center gap-2"><input type="checkbox" checked={a.sepia} onChange={(e) => setA({ ...a, sepia: e.target.checked })} /> Sepia</label>
            <button className="btn-ghost !py-1 ml-auto" onClick={() => setA(neutral)}>Reset</button></div>
          <button className="btn w-full" onClick={save}>Download edited picture</button>
        </div>
      )}
    </div>
  );
}
