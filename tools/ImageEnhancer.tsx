"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CompareView from "@/components/CompareView";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { enhance, NEUTRAL, PRESETS, type EnhanceOpts } from "@/lib/enhance";
import { MAX_SIDE, EXT, baseName, drawn, encode, fmtOf, openImage, type Fmt } from "@/lib/imageWork";

const PREVIEW = 1100;
const SLIDERS: { key: keyof EnhanceOpts; label: string; max: number; hint: string }[] = [
  { key: "auto", label: "Auto levels and exposure", max: 100, hint: "Uses the full range from dark to light and fixes a picture that is too dark or too flat" },
  { key: "shadows", label: "Brighten shadows", max: 100, hint: "Lifts dark areas" },
  { key: "highlights", label: "Calm highlights", max: 100, hint: "Tones down very bright areas" },
  { key: "contrast", label: "Contrast", max: 60, hint: "Separates light from dark" },
  { key: "vibrance", label: "Colour boost", max: 100, hint: "Lifts dull colours and leaves strong ones alone" },
  { key: "sharpen", label: "Sharpness", max: 100, hint: "Makes edges and fine detail crisper" },
  { key: "denoise", label: "Reduce grain", max: 100, hint: "Smooths noise in dark or high-ISO pictures" },
];

export default function ImageEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [orig, setOrig] = useState("");
  const [result, setResult] = useState("");
  const [opts, setOpts] = useState<EnhanceOpts>(PRESETS.Auto);
  const [preset, setPreset] = useState("Auto");
  const [fmt, setFmt] = useState<Fmt>("jpeg");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const img = useRef<HTMLImageElement | null>(null);
  const base = useRef<ImageData | null>(null);
  const prevUrl = useRef("");

  const open = async (files: File[]) => {
    const f = files[0]; if (!f) return; setError(""); setInfo(""); setBusy(true);
    try {
      const o = await openImage(f); img.current = o.img; const { canvas } = drawn(o.img, PREVIEW);
      base.current = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height);
      if (orig) URL.revokeObjectURL(orig);
      setOrig(o.url); setFile(f); setFmt(fmtOf(f)); setOpts(PRESETS.Auto); setPreset("Auto");
      setInfo(`${o.w} × ${o.h} px · ${formatBytes(f.size)}`);
    } catch { setError("Could not open that picture. Try a JPG, PNG or WebP."); setFile(null); }
    setBusy(false);
  };

  // the preview is the same maths on a reduced copy, so sliders feel instant
  const render = useCallback(async (o: EnhanceOpts) => {
    const b = base.current; if (!b) return;
    const copy = new ImageData(new Uint8ClampedArray(b.data), b.width, b.height); enhance(copy, o);
    const c = document.createElement("canvas"); c.width = b.width; c.height = b.height; c.getContext("2d")!.putImageData(copy, 0, 0);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
    if (!blob) return; const url = URL.createObjectURL(blob);
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); prevUrl.current = url; setResult(url);
  }, []);
  useEffect(() => { if (!file) return; const t = setTimeout(() => render(opts), 120); return () => clearTimeout(t); }, [opts, file, render]);
  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); }, []);

  const set = (patch: Partial<EnhanceOpts>) => { setOpts((o) => ({ ...o, ...patch })); setPreset(""); };
  const pick = (name: string) => { setOpts(name === "None" ? { ...NEUTRAL } : PRESETS[name]); setPreset(name); };

  const save = async () => {
    if (!file || !img.current) return; setSaving(true); setError("");
    try {
      await new Promise((r) => setTimeout(r, 40));                                 // let the "working" message appear first
      const { canvas, scale } = drawn(img.current, MAX_SIDE), g = canvas.getContext("2d", { willReadFrequently: true })!;
      const px = g.getImageData(0, 0, canvas.width, canvas.height); enhance(px, opts); g.putImageData(px, 0, 0);
      const blob = await encode(canvas, fmt, 0.93);
      download(blob, `${baseName(file)}-enhanced.${EXT[fmt]}`, blob.type);
      setInfo(`Saved ${canvas.width} × ${canvas.height} px · ${formatBytes(blob.size)}${scale < 1 ? " (very large pictures are scaled down to 8000 px)" : ""}`);
    } catch { setError("Could not save the picture. Try a smaller one or another format."); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={open} hint="JPG, PNG or WebP. The picture is improved on your device and never uploaded." />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="ie-error">{error}</p>}
      {busy && !file && <WaterLoader active label="Opening the picture…" />}
      {file && orig && (
        <>
          <CompareView original={orig} result={result} />
          {info && <p className="text-xs text-neutral-500" data-testid="ie-info">{file.name} · {info}. The preview is reduced for speed; the saved picture is full size.</p>}

          <section className="space-y-3 rounded-2xl border bg-white p-4" aria-label="Enhance settings">
            <div><p className="mb-2 text-sm font-medium">Quick fix</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">{[...Object.keys(PRESETS), "None"].map((n) => <button key={n} className={`chip shrink-0 ${preset === n ? "chip-active" : ""}`} onClick={() => pick(n)} data-testid={`ie-preset-${n.replace(/\s+/g, "-").toLowerCase()}`}>{n}</button>)}</div>
              <p className="mt-1 text-xs text-neutral-500">Auto suits most photos. Low light is for dark, grainy pictures. Document makes text and paper clearer.</p></div>
            <label className="block text-sm"><span className="flex justify-between"><b>How much</b><span data-testid="ie-strength-val">{opts.strength}%</span></span>
              <input type="range" min={0} max={100} value={opts.strength} onChange={(e) => set({ strength: +e.target.value })} aria-label="Strength of the enhancement" data-testid="ie-strength" className="mt-1 h-8 w-full" /></label>
            <details className="rounded-xl border p-3" data-testid="ie-fine"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold">Fine tune</summary>
              <div className="space-y-3 pt-2">
                {SLIDERS.map((s) => (
                  <label key={s.key} className="block text-sm"><span className="flex justify-between"><span>{s.label}</span><span>{opts[s.key] as number}</span></span>
                    <input type="range" min={0} max={s.max} value={opts[s.key] as number} onChange={(e) => set({ [s.key]: +e.target.value } as Partial<EnhanceOpts>)} aria-label={s.label} data-testid={`ie-${s.key}`} className="h-8 w-full" /><span className="text-xs text-neutral-500">{s.hint}</span></label>))}
                <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={opts.whiteBalance} onChange={(e) => set({ whiteBalance: e.target.checked })} data-testid="ie-wb" /> Fix a colour cast (too blue, too yellow…)</label>
              </div></details>
          </section>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">Save as
              <select className="rounded-lg border px-2 py-2.5" value={fmt} onChange={(e) => setFmt(e.target.value as Fmt)} aria-label="Save as" data-testid="ie-fmt"><option value="jpeg">JPG (smaller)</option><option value="png">PNG (no quality loss)</option><option value="webp">WebP (small and sharp)</option></select></label>
            <button className="btn min-w-[200px] flex-1" onClick={save} disabled={saving} data-testid="ie-save">{saving ? "Saving full size…" : "Download enhanced picture"}</button>
          </div>
        </>
      )}
    </div>
  );
}
