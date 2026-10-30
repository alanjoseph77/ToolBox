"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";

type Tool = "pen" | "rect" | "arrow" | "highlight" | "blur" | "text";
const toolList: { id: Tool; label: string }[] = [
  { id: "pen", label: "✏️ Pen" }, { id: "rect", label: "▭ Box" }, { id: "arrow", label: "➜ Arrow" },
  { id: "highlight", label: "🖍 Highlight" }, { id: "blur", label: "▦ Blur" }, { id: "text", label: "T Text" },
];

export default function ScreenshotEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [tool, setTool] = useState<Tool>("rect");
  const [color, setColor] = useState("#ef4444");
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState<ImageData[]>([]);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const snap = useRef<ImageData | null>(null);

  const ctx = () => canvasRef.current!.getContext("2d", { willReadFrequently: true })!;
  const scaleUnit = () => { const c = canvasRef.current!; return c.width / c.getBoundingClientRect().width; };

  const setImage = async (blob: Blob) => {
    const img = await loadImage(blob), c = canvasRef.current!;
    c.width = img.width; c.height = img.height; ctx().drawImage(img, 0, 0); setHistory([]); setLoaded(true);
  };

  // Paste a screenshot straight from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const f = item?.getAsFile(); if (f) setImage(f);
    };
    window.addEventListener("paste", onPaste); return () => window.removeEventListener("paste", onPaste);
  }, []);

  const pos = (e: React.PointerEvent) => { const c = canvasRef.current!, b = c.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height }; };
  const lw = () => size * scaleUnit();

  const drawShape = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const g = ctx(); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = lw(); g.strokeStyle = color; g.fillStyle = color;
    if (tool === "rect") g.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else if (tool === "highlight") { g.globalAlpha = 0.35; g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); g.globalAlpha = 1; }
    else if (tool === "arrow") {
      const ang = Math.atan2(b.y - a.y, b.x - a.x), head = lw() * 4;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.beginPath(); g.moveTo(b.x, b.y);
      g.lineTo(b.x - head * Math.cos(ang - 0.45), b.y - head * Math.sin(ang - 0.45));
      g.lineTo(b.x - head * Math.cos(ang + 0.45), b.y - head * Math.sin(ang + 0.45)); g.closePath(); g.fill();
    } else if (tool === "blur") {
      const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
      if (w < 2 || h < 2) return;
      const block = Math.max(6, Math.round(Math.min(w, h) / 8));
      const t = document.createElement("canvas"); t.width = Math.max(1, Math.round(w / block)); t.height = Math.max(1, Math.round(h / block));
      const tg = t.getContext("2d")!; tg.imageSmoothingEnabled = false;
      tg.drawImage(snap.current ? toCanvas(snap.current) : canvasRef.current!, x, y, w, h, 0, 0, t.width, t.height);
      g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, t.width, t.height, x, y, w, h); g.imageSmoothingEnabled = true;
    }
  };
  const toCanvas = (d: ImageData) => { const c = document.createElement("canvas"); c.width = d.width; c.height = d.height; c.getContext("2d")!.putImageData(d, 0, 0); return c; };

  const down = (e: React.PointerEvent) => {
    const c = canvasRef.current!, p = pos(e);
    if (tool === "text") {
      const t = window.prompt("Text to add:");
      if (t) { setHistory((h) => [...h, ctx().getImageData(0, 0, c.width, c.height)]); const g = ctx(); g.fillStyle = color; g.font = `bold ${Math.round(size * 5 * scaleUnit())}px sans-serif`; g.textBaseline = "top"; g.fillText(t, p.x, p.y); }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    startPt.current = p; snap.current = ctx().getImageData(0, 0, c.width, c.height);
    if (tool === "pen") { const g = ctx(); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = lw(); g.strokeStyle = color; g.beginPath(); g.moveTo(p.x, p.y); }
  };
  const move = (e: React.PointerEvent) => {
    if (!startPt.current) return;
    const p = pos(e);
    if (tool === "pen") { const g = ctx(); g.lineTo(p.x, p.y); g.stroke(); return; }
    ctx().putImageData(snap.current!, 0, 0); drawShape(startPt.current, p);
  };
  const up = () => { if (startPt.current && snap.current) setHistory((h) => [...h, snap.current!]); startPt.current = null; snap.current = null; };

  const undo = () => { const last = history[history.length - 1]; if (!last) return; ctx().putImageData(last, 0, 0); setHistory(history.slice(0, -1)); };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={(f) => f[0] && setImage(f[0])} hint="Choose a screenshot, or paste one from your clipboard (Ctrl/Cmd + V)." />
      <div className={loaded ? "space-y-3 rounded-xl border bg-white p-3" : "hidden"}>
        <div className="flex flex-wrap items-center gap-2">
          {toolList.map((t) => <button key={t.id} className={t.id === tool ? "btn !px-3 !py-1.5" : "btn-ghost !px-3 !py-1.5"} onClick={() => setTool(t.id)}>{t.label}</button>)}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9" aria-label="Colour" />
          <input type="range" min={1} max={14} value={size} onChange={(e) => setSize(+e.target.value)} aria-label="Size" />
        </div>
        <canvas ref={canvasRef} className="max-h-[70vh] w-full touch-none cursor-crosshair rounded border object-contain" onPointerDown={down} onPointerMove={move} onPointerUp={up} />
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" disabled={!history.length} onClick={undo}>Undo</button>
          <button className="btn" onClick={async () => download(await canvasToBlob(canvasRef.current!, "image/png"), "screenshot.png")}>Download PNG</button>
        </div>
      </div>
    </div>
  );
}
