"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CompareView from "@/components/CompareView";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";
import { DEFAULT_INVERT, invert, type InvertMode, type InvertOpts } from "@/lib/invert";
import { MAX_SIDE, EXT, baseName, drawn, encode, openImage, type Fmt } from "@/lib/imageWork";

const PREVIEW = 1100;
const MODES: [InvertMode, string, string][] = [
  ["negative", "Negative", "Every colour becomes its opposite, like a photo negative"],
  ["smart", "Smart invert", "Light and dark swap but colours stay the same. Good for screenshots, documents and dark mode"],
  ["bw", "Black & white negative", "Turns the picture grey, then inverts it"],
];

/** Applies the inversion, then the mirror / upside-down flips, and returns a new canvas. */
function make(src: HTMLCanvasElement, o: InvertOpts, mirror: boolean, flip: boolean): HTMLCanvasElement {
  const g = src.getContext("2d", { willReadFrequently: true })!, px = g.getImageData(0, 0, src.width, src.height); invert(px, o);
  const t = document.createElement("canvas"); t.width = src.width; t.height = src.height; t.getContext("2d")!.putImageData(px, 0, 0);
  if (!mirror && !flip) return t;
  const out = document.createElement("canvas"); out.width = src.width; out.height = src.height; const c = out.getContext("2d")!;
  c.translate(mirror ? out.width : 0, flip ? out.height : 0); c.scale(mirror ? -1 : 1, flip ? -1 : 1); c.drawImage(t, 0, 0); return out;
}

export default function InvertImage() {
  const [file, setFile] = useState<File | null>(null);
  const [orig, setOrig] = useState("");
  const [result, setResult] = useState("");
  const [o, setO] = useState<InvertOpts>(DEFAULT_INVERT);
  const [mirror, setMirror] = useState(false);
  const [flip, setFlip] = useState(false);
  const [fmt, setFmt] = useState<Fmt>("png");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const img = useRef<HTMLImageElement | null>(null);
  const small = useRef<HTMLCanvasElement | null>(null);
  const prevUrl = useRef("");

  const open = async (files: File[]) => {
    const f = files[0]; if (!f) return; setError(""); setInfo("");
    try {
      const x = await openImage(f); img.current = x.img; small.current = drawn(x.img, PREVIEW).canvas;
      if (orig) URL.revokeObjectURL(orig);
      setOrig(x.url); setFile(f); setFmt(/jpe?g/i.test(f.type) ? "jpeg" : "png"); setInfo(`${x.w} × ${x.h} px · ${formatBytes(f.size)}`);
    } catch { setError("Could not open that picture. Try a JPG, PNG or WebP."); setFile(null); }
  };

  const render = useCallback(async () => {
    if (!small.current) return;
    const c = make(small.current, o, mirror, flip), blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
    if (!blob) return; const url = URL.createObjectURL(blob); if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); prevUrl.current = url; setResult(url);
  }, [o, mirror, flip]);
  useEffect(() => { if (!file) return; const t = setTimeout(render, 100); return () => clearTimeout(t); }, [render, file]);
  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); }, []);

  const save = async () => {
    if (!file || !img.current) return; setSaving(true); setError("");
    try {
      await new Promise((r) => setTimeout(r, 30));
      const { canvas, scale } = drawn(img.current, MAX_SIDE), out = make(canvas, o, mirror, flip), blob = await encode(out, fmt, 0.93);
      const tag = [o.strength > 0 && (o.mode !== "negative" || o.r || o.g || o.b) ? "inverted" : "", mirror ? "mirrored" : "", flip ? "flipped" : ""].filter(Boolean).join("-") || "copy";
      download(blob, `${baseName(file)}-${tag}.${EXT[fmt]}`, blob.type);
      setInfo(`Saved ${out.width} × ${out.height} px · ${formatBytes(blob.size)}${scale < 1 ? " (very large pictures are scaled down to 8000 px)" : ""}`);
    } catch { setError("Could not save the picture. Try a smaller one or another format."); }
    setSaving(false);
  };
  const flipStyle: React.CSSProperties = { transform: `scale(${mirror ? -1 : 1}, ${flip ? -1 : 1})` };   // the original is shown flipped too, so only the colours differ

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={open} hint="JPG, PNG or WebP. Transparent PNGs keep their transparency. Nothing is uploaded." />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="iv-error">{error}</p>}
      {file && orig && (
        <>
          <CompareView original={orig} result={result} originalStyle={flipStyle} />
          {info && <p className="text-xs text-neutral-500" data-testid="iv-info">{file.name} · {info}</p>}
          <section className="space-y-4 rounded-2xl border bg-white p-4" aria-label="Invert settings">
            <div role="radiogroup" aria-label="Type of invert" className="grid gap-2 sm:grid-cols-3">
              {MODES.map(([m, label, hint]) => (
                <button key={m} role="radio" aria-checked={o.mode === m} onClick={() => setO({ ...o, mode: m })} data-testid={`iv-mode-${m}`} className={`rounded-xl border p-3 text-left text-sm ${o.mode === m ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-300"}`}><b>{label}</b><span className="mt-0.5 block text-xs text-neutral-500">{hint}</span></button>))}
            </div>
            {o.mode === "negative" && (
              <div><p className="mb-1 text-sm font-medium">Colours to invert</p>
                <div className="flex flex-wrap gap-x-5">{([["r", "Red"], ["g", "Green"], ["b", "Blue"]] as const).map(([k, l]) => <label key={k} className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.checked })} data-testid={`iv-${k}`} />{l}</label>)}</div></div>
            )}
            <label className="block text-sm"><span className="flex justify-between"><b>Strength</b><span>{o.strength}%</span></span>
              <input type="range" min={0} max={100} value={o.strength} onChange={(e) => setO({ ...o, strength: +e.target.value })} aria-label="Strength of the invert" data-testid="iv-strength" className="mt-1 h-8 w-full" />
              <span className="text-xs text-neutral-500">100% is a full invert. Lower values blend with the original.</span></label>
            <div><p className="mb-1 text-sm font-medium">Turn it around (optional)</p>
              <div className="flex flex-wrap gap-x-5"><label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={mirror} onChange={(e) => setMirror(e.target.checked)} data-testid="iv-mirror" />Mirror (left to right)</label>
                <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={flip} onChange={(e) => setFlip(e.target.checked)} data-testid="iv-flip" />Flip upside down</label></div></div>
          </section>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">Save as
              <select className="rounded-lg border px-2 py-2.5" value={fmt} onChange={(e) => setFmt(e.target.value as Fmt)} aria-label="Save as" data-testid="iv-fmt"><option value="png">PNG (keeps transparency)</option><option value="jpeg">JPG (smaller)</option><option value="webp">WebP</option></select></label>
            <button className="btn min-w-[200px] flex-1" onClick={save} disabled={saving} data-testid="iv-save">{saving ? "Saving full size…" : "Download picture"}</button>
          </div>
        </>
      )}
    </div>
  );
}
