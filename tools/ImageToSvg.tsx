"use client";
import { useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes, loadImage } from "@/lib/files";

export default function ImageToSvg() {
  const file = useRef<File | null>(null);
  const [svg, setSvg] = useState("");
  const [colors, setColors] = useState(8);
  const [smooth, setSmooth] = useState(true);
  const [dropWhite, setDropWhite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const trace = async (f: File, n = colors, sm = smooth, dw = dropWhite) => {
    setBusy(true); setError("");
    try {
      const img = await loadImage(f), k = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      const g = c.getContext("2d", { willReadFrequently: true })!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      const ImageTracer = (await import("imagetracerjs")).default;
      await new Promise((r) => setTimeout(r, 30));                         // let the spinner paint
      let out = ImageTracer.imagedataToSVG(g.getImageData(0, 0, c.width, c.height), {
        numberofcolors: n, colorsampling: 2, colorquantcycles: 3, ltres: sm ? 1 : 0.5, qtres: sm ? 1 : 0.5, pathomit: 8, blurradius: sm ? 1 : 0, blurdelta: 20, viewbox: true, scale: 1, roundcoords: 1,
      });
      if (dw) out = out.replace(/<path[^>]*fill="rgb\((\d+),(\d+),(\d+)\)"[^>]*\/>/g, (m, r, gg, b) => (+r >= 245 && +gg >= 245 && +b >= 245 ? "" : m));
      setSvg(out);
    } catch { setError("Could not trace this image. Try a smaller picture."); setSvg(""); }
    setBusy(false);
  };
  const again = (n: number, sm: boolean, dw: boolean) => { setColors(n); setSmooth(sm); setDropWhite(dw); if (file.current) trace(file.current, n, sm, dw); };
  const url = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : "";

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={(f) => { file.current = f[0]; trace(f[0]); }} hint="Best with logos, icons, drawings and signatures. Photos become artistic, not exact." />
      <div className="rounded-xl border bg-white p-3 text-sm space-y-2">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">Colours
            <select className="rounded-lg border px-2 py-2" value={colors} onChange={(e) => again(+e.target.value, smooth, dropWhite)}>{[2, 4, 8, 16, 32].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={smooth} onChange={(e) => again(colors, e.target.checked, dropWhite)} /> Smooth edges</label>
          <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={dropWhite} onChange={(e) => again(colors, smooth, e.target.checked)} /> Transparent background (removes white)</label>
        </div>
        <p className="text-neutral-500">For a one-colour logo choose 2 colours. More colours give more detail and a bigger file.</p>
      </div>
      <WaterLoader active={busy} label="Tracing the image…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {svg && !busy && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="SVG result" data-testid="svg-preview" className="max-h-96 w-full rounded-xl border bg-[conic-gradient(#e2e8f0_25%,#fff_0_50%,#e2e8f0_0_75%,#fff_0)] bg-[length:20px_20px] object-contain" />
          <p className="text-sm text-neutral-600" data-testid="svg-info">SVG · {formatBytes(svg.length)} · {(svg.match(/<path/g) || []).length} shapes</p>
          <button className="btn w-full" onClick={() => download(new Blob([svg], { type: "image/svg+xml" }), "vector.svg")}>Download SVG</button>
        </div>
      )}
    </div>
  );
}
