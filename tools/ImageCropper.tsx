"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";

interface Rect { x: number; y: number; w: number; h: number }
const ratios: { label: string; r: number | null }[] = [
  { label: "Free", r: null }, { label: "1:1", r: 1 }, { label: "Passport 35:45", r: 35 / 45 },
  { label: "Exam 200:230", r: 200 / 230 }, { label: "4:3", r: 4 / 3 }, { label: "16:9", r: 16 / 9 },
];

export default function ImageCropper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [loaded, setLoaded] = useState(false);

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    const img = await loadImage(f[0]);
    imgRef.current = img; setRect(null); setLoaded(true);
    const c = canvasRef.current!; c.width = img.width; c.height = img.height;
  };

  useEffect(() => {
    const c = canvasRef.current, img = imgRef.current;
    if (!c || !img || !loaded) return;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    if (rect) {
      g.fillStyle = "rgba(0,0,0,.5)";
      g.fillRect(0, 0, c.width, rect.y); g.fillRect(0, rect.y + rect.h, c.width, c.height);
      g.fillRect(0, rect.y, rect.x, rect.h); g.fillRect(rect.x + rect.w, rect.y, c.width, rect.h);
      g.strokeStyle = "#fff"; g.lineWidth = Math.max(2, c.width / 300); g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  }, [rect, loaded]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!, b = c.getBoundingClientRect();
    return { x: Math.min(c.width, Math.max(0, ((e.clientX - b.left) / b.width) * c.width)), y: Math.min(c.height, Math.max(0, ((e.clientY - b.top) / b.height) * c.height)) };
  };
  const build = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => {
    let w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
    const c = canvasRef.current!;
    const x = b.x >= a.x ? a.x : a.x - w, y = b.y >= a.y ? a.y : a.y - h;
    return { x: Math.max(0, x), y: Math.max(0, y), w: Math.min(w, c.width), h: Math.min(h, c.height) };
  };

  const crop = async () => {
    if (!rect) return;
    const out = document.createElement("canvas");
    out.width = Math.round(rect.w); out.height = Math.round(rect.h);
    out.getContext("2d")!.drawImage(imgRef.current!, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height);
    download(await canvasToBlob(out, "image/png"), "cropped.png");
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={pick} />
      <div className={loaded ? "space-y-3 rounded-xl border bg-white p-3" : "hidden"}>
        <div className="flex flex-wrap gap-2">
          {ratios.map((r) => <button key={r.label} className={r.r === ratio ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => { setRatio(r.r); setRect(null); }}>{r.label}</button>)}
        </div>
        <p className="text-sm text-slate-600">Drag on the image to choose the crop area{rect ? ` · ${Math.round(rect.w)}×${Math.round(rect.h)}px` : ""}.</p>
        <canvas ref={canvasRef} className="max-h-[65vh] w-full touch-none cursor-crosshair rounded-lg border object-contain"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = pos(e); }}
          onPointerMove={(e) => { if (start.current) setRect(build(start.current, pos(e))); }}
          onPointerUp={() => { start.current = null; }} />
        <button className="btn w-full" disabled={!rect || rect.w < 2 || rect.h < 2} onClick={crop}>Crop &amp; download</button>
      </div>
    </div>
  );
}
