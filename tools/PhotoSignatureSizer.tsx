"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes, loadImage } from "@/lib/files";
import { fitCanvas, jpegWithinKb } from "@/lib/photoSize";

interface Spec { label: string; w: number; h: number; kb: number }
interface Out { url: string; blob: Blob; w: number; h: number; reached: boolean; name: string }

function Panel({ spec: init, id }: { spec: Spec; id: string }) {
  const [spec, setSpec] = useState(init);
  const [mode, setMode] = useState<"crop" | "stretch">("crop");
  const [src, setSrc] = useState<File | null>(null);
  const [out, setOut] = useState<Out | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (f: File, s = spec, m = mode) => {
    setBusy(true); setError("");
    try {
      const img = await loadImage(f);
      const c = fitCanvas(img, Math.max(10, s.w), Math.max(10, s.h), m);
      const r = await jpegWithinKb(c, Math.max(5, s.kb));
      setOut({ url: URL.createObjectURL(r.blob), blob: r.blob, w: c.width, h: c.height, reached: r.reached, name: `${id}-${c.width}x${c.height}.jpg` });
    } catch { setError("Could not read this image."); setOut(null); }
    setBusy(false);
  };
  const num = (k: "w" | "h" | "kb") => (e: React.ChangeEvent<HTMLInputElement>) => setSpec({ ...spec, [k]: Math.max(0, +e.target.value) });

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4" data-panel={id}>
      <p className="font-semibold">{spec.label}</p>
      <Dropzone accept="image/*" onFiles={(f) => { if (f[0]) { setSrc(f[0]); return run(f[0]); } }} hint="Add the picture. It stays on your device." />
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label" htmlFor={`${id}-w`}>Width px</label><input id={`${id}-w`} type="number" className="input" value={spec.w} onChange={num("w")} /></div>
        <div><label className="label" htmlFor={`${id}-h`}>Height px</label><input id={`${id}-h`} type="number" className="input" value={spec.h} onChange={num("h")} /></div>
        <div><label className="label" htmlFor={`${id}-k`}>Max KB</label><input id={`${id}-k`} type="number" className="input" value={spec.kb} onChange={num("kb")} /></div>
      </div>
      <div className="flex gap-2">{(["crop", "stretch"] as const).map((m) => <button key={m} className={mode === m ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => { setMode(m); if (src) run(src, spec, m); }}>{m === "crop" ? "Crop to fit" : "Stretch"}</button>)}
        <button className="btn-ghost !py-1.5 ml-auto" disabled={!src || busy} onClick={() => src && run(src)}>Apply size</button></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && (
        <div className="space-y-2 border-t pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out.url} alt={`${spec.label} result`} className="max-h-48 rounded border" />
          <p className="text-sm" data-result={id}>{out.w} × {out.h} px · <b>{formatBytes(out.blob.size)}</b> {out.reached ? "" : <span className="text-red-600">(could not get under {spec.kb} KB. Try a bigger limit.)</span>}</p>
          <button className="btn w-full" onClick={() => download(out.blob, out.name)}><Download className="h-4 w-4" /> Download {out.name}</button>
        </div>
      )}
    </div>
  );
}

export default function PhotoSignatureSizer() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="photo" spec={{ label: "Passport photo", w: 200, h: 230, kb: 50 }} />
        <Panel id="signature" spec={{ label: "Signature", w: 140, h: 60, kb: 20 }} />
      </div>
      <p className="text-xs text-neutral-500">The sizes above are common starting points. Every exam and job form sets its own width, height and file size, so type the exact numbers from your form&apos;s instructions.</p>
    </div>
  );
}
