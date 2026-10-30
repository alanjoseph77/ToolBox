"use client";
import { useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import CopyButton from "@/components/CopyButton";
import { loadImage } from "@/lib/files";

function toHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function ColorPicker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [rgb, setRgb] = useState<[number, number, number]>([79, 70, 229]);

  const hex = "#" + rgb.map((n) => n.toString(16).padStart(2, "0")).join("");
  const rgbStr = `rgb(${rgb.join(", ")})`;
  const hsl = toHsl(...rgb);

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    const img = await loadImage(f[0]);
    const c = canvasRef.current!; c.width = img.width; c.height = img.height;
    c.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0);
    setLoaded(true);
  };
  const sample = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!, b = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - b.left) / b.width) * c.width), y = Math.floor(((e.clientY - b.top) / b.height) * c.height);
    const d = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
    setRgb([d[0], d[1], d[2]]);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={pick} hint="Tap anywhere on the image to pick a colour." />
      <canvas ref={canvasRef} onPointerDown={sample} className={loaded ? "max-h-[60vh] w-full cursor-crosshair rounded-lg border object-contain" : "hidden"} />
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4">
        <input type="color" value={hex} onChange={(e) => { const v = e.target.value; setRgb([1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number]); }} className="h-16 w-16 cursor-pointer" aria-label="Colour" />
        <div className="space-y-1 text-sm font-mono">
          {[hex.toUpperCase(), rgbStr, hsl].map((t) => <div key={t} className="flex items-center gap-2"><span className="w-48">{t}</span><CopyButton text={t} /></div>)}
        </div>
      </div>
    </div>
  );
}
