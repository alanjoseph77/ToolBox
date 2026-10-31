"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { fitFont } from "@/lib/meme";

const FONT = 'Impact, "Anton", "Arial Black", "Helvetica Neue", Arial, sans-serif';
const MAX_SIDE = 1600;

function drawText(g: CanvasRenderingContext2D, text: string, w: number, h: number, where: "top" | "bottom", scale: number, color: string) {
  if (!text.trim()) return;
  const t = text.toUpperCase(), pad = w * 0.04;
  const measureAt = (size: number) => { g.font = `${size}px ${FONT}`; return (s: string) => g.measureText(s).width; };
  const { size, lines } = fitFont(measureAt, t, w - pad * 2, h * 0.34, h * 0.11 * scale);
  g.font = `${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "top"; g.lineJoin = "round";
  g.lineWidth = Math.max(2, size / 7); g.strokeStyle = "#000"; g.fillStyle = color;
  const blockH = lines.length * size * 1.12;
  let y = where === "top" ? pad : h - pad - blockH;
  for (const line of lines) { g.strokeText(line, w / 2, y); g.fillText(line, w / 2, y); y += size * 1.12; }
}

export default function MemeGenerator() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("meme");
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState("#ffffff");
  const canvas = useRef<HTMLCanvasElement>(null);

  const paint = (c: HTMLCanvasElement) => {
    if (!img) return;
    const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const g = c.getContext("2d")!; g.drawImage(img, 0, 0, c.width, c.height);
    drawText(g, top, c.width, c.height, "top", scale, color); drawText(g, bottom, c.width, c.height, "bottom", scale, color);
  };
  useEffect(() => { if (canvas.current) paint(canvas.current); });

  const load = async (files: File[]) => { const f = files[0]; if (!f) return; setImg(await loadImage(f)); setName(f.name.replace(/\.[^.]+$/, "")); };
  const save = async (type: "image/png" | "image/jpeg") => {
    const c = document.createElement("canvas"); paint(c);
    download(await canvasToBlob(c, type, 0.92), `${name}-meme.${type === "image/png" ? "png" : "jpg"}`);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={load} hint="Pick any picture, then type the top and bottom text." />
      {img && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <input className="input" placeholder="Top text" aria-label="Top text" value={top} onChange={(e) => setTop(e.target.value)} />
          <input className="input" placeholder="Bottom text" aria-label="Bottom text" value={bottom} onChange={(e) => setBottom(e.target.value)} />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex-1 text-sm font-medium">Text size: {Math.round(scale * 100)}%
              <input type="range" min={0.5} max={1.5} step={0.1} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full" aria-label="Text size" /></label>
            <label className="flex items-center gap-2 text-sm font-medium">Colour <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Text colour" /></label>
          </div>
          <canvas ref={canvas} aria-label="Meme preview" className="mx-auto block w-full max-w-xl rounded-lg border" />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={() => save("image/png")}>Download PNG</button>
            <button className="btn-ghost" onClick={() => save("image/jpeg")}>Download JPG</button>
          </div>
        </div>
      )}
    </div>
  );
}
