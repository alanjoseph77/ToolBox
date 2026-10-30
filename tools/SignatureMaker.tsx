"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { inkFromPhoto, trimAndScale } from "@/lib/signature";

const inks = [["Black", "#111111"], ["Blue", "#1d3fbb"], ["Dark blue", "#0b1f5c"]] as const;
type Pt = { x: number; y: number };

export default function SignatureMaker() {
  const [tab, setTab] = useState<"draw" | "photo">("draw");
  const [ink, setInk] = useState<string>(inks[0][1]);
  const [thickness, setThickness] = useState(4);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [threshold, setThreshold] = useState(170);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(0);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const pad = useRef<HTMLCanvasElement>(null);
  const current = useRef<Pt[] | null>(null);

  const source = (): HTMLCanvasElement | null => {
    if (tab === "draw") {
      const c = document.createElement("canvas"); c.width = 900; c.height = 360;
      const g = c.getContext("2d")!; g.strokeStyle = ink; g.lineWidth = thickness * 1.6; g.lineCap = "round"; g.lineJoin = "round";
      for (const s of strokes) { g.beginPath(); s.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); if (s.length === 1) g.lineTo(s[0].x + 0.1, s[0].y); g.stroke(); }
      return c;
    }
    if (!photo) return null;
    const k = Math.min(1, 1600 / Math.max(photo.width, photo.height));
    const c = document.createElement("canvas"); c.width = Math.round(photo.width * k); c.height = Math.round(photo.height * k);
    c.getContext("2d")!.drawImage(photo, 0, 0, c.width, c.height);
    return inkFromPhoto(c, threshold, ink);
  };
  const result = () => { const s = source(); return s ? trimAndScale(s, 14, width || undefined) : null; };

  // redraw the pad and the preview whenever something changes
  useEffect(() => {
    const c = pad.current;
    if (c && tab === "draw") {
      const g = c.getContext("2d")!; g.clearRect(0, 0, c.width, c.height);
      const s = source(); if (s) g.drawImage(s, 0, 0);
    }
    const r = result(); setPreview(r ? r.toDataURL("image/png") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ink, thickness, strokes, threshold, photo, width]);

  const pos = (e: React.PointerEvent) => { const b = pad.current!.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * 900, y: ((e.clientY - b.top) / b.height) * 360 }; };
  const save = async () => {
    const r = result(); if (!r) { setError("Draw or add a signature first."); return; }
    download(await canvasToBlob(r, "image/png"), "signature.png");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className={tab === "draw" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setTab("draw")}>Draw</button>
        <button className={tab === "photo" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setTab("photo")}>From a photo</button>
      </div>
      <div className="space-y-3 rounded-xl border bg-white p-4">
        {tab === "draw" ? (
          <>
            <canvas ref={pad} width={900} height={360} aria-label="Signature pad" className="w-full touch-none rounded-lg border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:20px_20px] dark:bg-[repeating-conic-gradient(#262626_0%_25%,#0a0a0a_0%_50%)]"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); current.current = [pos(e)]; setStrokes((s) => [...s, current.current!]); }}
              onPointerMove={(e) => { if (!current.current) return; current.current.push(pos(e)); setStrokes((s) => [...s.slice(0, -1), [...current.current!]]); }}
              onPointerUp={() => { current.current = null; }} />
            <p className="text-xs text-neutral-500">Sign inside the box with your finger or mouse.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-ghost !py-1.5" disabled={!strokes.length} onClick={() => setStrokes(strokes.slice(0, -1))}>Undo</button>
              <button className="btn-ghost !py-1.5" disabled={!strokes.length} onClick={() => setStrokes([])}>Clear</button>
              <label className="flex items-center gap-2 text-sm">Pen <input type="range" min={2} max={10} value={thickness} onChange={(e) => setThickness(+e.target.value)} /></label>
            </div>
          </>
        ) : (
          <>
            <Dropzone accept="image/*" onFiles={async (f) => { if (f[0]) setPhoto(await loadImage(f[0])); }} hint="Sign on plain white paper, take a straight, well-lit photo." />
            {photo && <div><label className="label">Remove background: {threshold}</label><input type="range" min={60} max={240} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full" /></div>}
          </>
        )}
        <div className="flex flex-wrap items-center gap-2"><span className="label !mb-0">Ink</span>{inks.map(([n, c]) => <button key={c} aria-label={n} onClick={() => setInk(c)} className={`h-8 w-8 rounded-full border-2 ${ink === c ? "border-brand-600" : "border-neutral-300"}`} style={{ background: c }} />)}</div>
      </div>
      {preview && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="label">Your signature (transparent background)</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Signature preview" className="max-h-32 rounded border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#262626_0%_25%,#0a0a0a_0%_50%)]" />
          <div className="flex flex-wrap items-center gap-2"><span className="label !mb-0">Width</span>
            {[[0, "Original"], [600, "600 px"], [400, "400 px"], [200, "200 px"]].map(([w, l]) => <button key={w} className={width === w ? "btn !min-h-0 !py-1" : "btn-ghost !min-h-0 !py-1"} onClick={() => setWidth(w as number)}>{l}</button>)}</div>
          <button className="btn w-full" onClick={save}>Download PNG</button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-500">The PNG is transparent, so you can place it on forms, documents and the Sign PDF tool.</p>
    </div>
  );
}
