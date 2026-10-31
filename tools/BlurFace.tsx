"use client";
import { useRef, useState } from "react";
import { ScanFace } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { obscure, type BlurMode, type Rect } from "@/lib/blur";
import { canvasToBlob, download, loadImage } from "@/lib/files";

const MAX_SIDE = 3000;
declare global { interface Window { FaceDetector?: new (o?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect(i: CanvasImageSource): Promise<{ boundingBox: DOMRectReadOnly }[]> } } }

export default function BlurFace() {
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("photo");
  const [areas, setAreas] = useState<Rect[]>([]);
  const [mode, setMode] = useState<BlurMode>("blur");
  const [strength, setStrength] = useState(6);
  const [round, setRound] = useState(true);
  const [drag, setDrag] = useState<Rect | null>(null);
  const [note, setNote] = useState("");
  const start = useRef<{ x: number; y: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);

  const load = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    try {
      const img = await loadImage(f), k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      setSrc(c); setUrl(c.toDataURL("image/jpeg", 0.85)); setAreas([]); setName(f.name.replace(/\.[^.]+$/, "")); setNote("");
    } catch { setNote("Could not open this image."); }
  };

  const render = () => {
    const c = document.createElement("canvas"); c.width = src!.width; c.height = src!.height;
    const g = c.getContext("2d", { willReadFrequently: true })!; g.drawImage(src!, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height);
    areas.forEach((a) => obscure(px, a, mode, strength, round));
    g.putImageData(px, 0, 0);
    return c;
  };

  const frac = (e: React.PointerEvent) => { const b = area.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) }; };

  const findFaces = async () => {
    if (!window.FaceDetector) { setNote("Automatic face finding is not available in this browser. Drag a box over each face instead."); return; }
    try {
      const faces = await new window.FaceDetector({ fastMode: false, maxDetectedFaces: 20 }).detect(src!);
      if (!faces.length) { setNote("No faces were found. Drag a box over each face instead."); return; }
      setAreas((a) => [...a, ...faces.map(({ boundingBox: b }) => ({ x: b.x - b.width * 0.1, y: b.y - b.height * 0.15, w: b.width * 1.2, h: b.height * 1.3 }))]);
      setNote(`Found ${faces.length} face${faces.length === 1 ? "" : "s"}. Check them below and add any that were missed.`);
    } catch { setNote("Face finding failed. Drag a box over each face instead."); }
  };

  const save = async () => {
    const blob = await canvasToBlob(render(), "image/png");
    download(blob, `${name}-blurred.png`);
  };

  const preview = useRef<HTMLCanvasElement>(null);
  const showPreview = () => {
    const out = render(), p = preview.current; if (!p) return;
    p.width = out.width; p.height = out.height; p.getContext("2d")!.drawImage(out, 0, 0);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={load} hint="Drag over faces, licence plates or anything private. Blurring happens on your device." />
      {note && <p className="text-sm text-neutral-600" role="status">{note}</p>}
      {src && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className={mode === "blur" ? "btn" : "btn-ghost"} onClick={() => setMode("blur")}>Blur</button>
            <button className={mode === "pixelate" ? "btn" : "btn-ghost"} onClick={() => setMode("pixelate")}>Pixelate</button>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={round} onChange={(e) => setRound(e.target.checked)} /> Round shape</label>
            <button className="btn-ghost ml-auto" onClick={findFaces}><ScanFace className="h-4 w-4" /> Find faces</button>
          </div>
          <label className="block text-sm font-medium">Strength: {strength}
            <input type="range" min={1} max={10} value={strength} onChange={(e) => setStrength(+e.target.value)} className="w-full" aria-label="Strength" />
          </label>
          <p className="text-sm text-neutral-600">Drag on the photo to cover an area. {areas.length ? `${areas.length} area${areas.length === 1 ? "" : "s"} selected.` : "Nothing selected yet."}</p>
          <div ref={area} aria-label="Photo to blur" className="relative mx-auto w-full max-w-xl touch-none select-none overflow-hidden rounded-lg border"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = frac(e); }}
            onPointerMove={(e) => { if (start.current) { const a = start.current, b = frac(e); setDrag({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }); } }}
            onPointerUp={() => { if (start.current && drag && drag.w > 0.01 && drag.h > 0.01) setAreas([...areas, { x: drag.x * src.width, y: drag.y * src.height, w: drag.w * src.width, h: drag.h * src.height }]); start.current = null; setDrag(null); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Your photo" draggable={false} className="block w-full" />
            {areas.map((a, i) => <div key={i} data-area="1" className={`absolute border-2 border-white bg-black/30 shadow ${round ? "rounded-[50%]" : ""}`} style={{ left: `${(a.x / src.width) * 100}%`, top: `${(a.y / src.height) * 100}%`, width: `${(a.w / src.width) * 100}%`, height: `${(a.h / src.height) * 100}%` }} />)}
            {drag && <div className={`absolute border-2 border-dashed border-white bg-black/30 ${round ? "rounded-[50%]" : ""}`} style={{ left: `${drag.x * 100}%`, top: `${drag.y * 100}%`, width: `${drag.w * 100}%`, height: `${drag.h * 100}%` }} />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" disabled={!areas.length} onClick={() => setAreas(areas.slice(0, -1))}>Undo last</button>
            <button className="btn-ghost" disabled={!areas.length} onClick={() => setAreas([])}>Clear all</button>
          </div>
          <button className="btn-ghost w-full" disabled={!areas.length} onClick={showPreview}>Preview result</button>
          <canvas ref={preview} aria-label="Blurred preview" className={`mx-auto w-full max-w-xl rounded-lg border ${preview.current?.width ? "" : "hidden"}`} />
          <button className="btn w-full" disabled={!areas.length} onClick={save}>{`Download blurred image (${areas.length} area${areas.length === 1 ? "" : "s"})`}</button>
          <p className="text-xs text-neutral-500">Blurred areas are changed in the saved file, so the original detail cannot be recovered from it. Keep your original photo safe.</p>
        </div>
      )}
    </div>
  );
}
