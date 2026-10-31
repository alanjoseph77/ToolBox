"use client";
import { useEffect, useRef, useState } from "react";
import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, formatBytes, loadImage } from "@/lib/files";

export default function RotateImage() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rot, setRot] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [error, setError] = useState("");
  const view = useRef<HTMLCanvasElement>(null);

  const render = (max = 0) => {
    const c = document.createElement("canvas"); if (!img) return c;
    const quarter = rot % 180 !== 0, k = max ? Math.min(1, max / Math.max(img.width, img.height)) : 1;
    const w = Math.round(img.width * k), h = Math.round(img.height * k);
    c.width = quarter ? h : w; c.height = quarter ? w : h;
    const g = c.getContext("2d")!; g.translate(c.width / 2, c.height / 2); g.scale(flipH ? -1 : 1, flipV ? -1 : 1); g.rotate((rot * Math.PI) / 180); // the flip is applied last, so it mirrors what you see
    g.drawImage(img, -w / 2, -h / 2, w, h);
    return c;
  };
  useEffect(() => { const v = view.current; if (!v || !img) return; const c = render(600); v.width = c.width; v.height = c.height; v.getContext("2d")!.drawImage(c, 0, 0); });

  const load = async (f: File[]) => {
    if (!f[0]) return; setError("");
    try { setImg(await loadImage(f[0])); setFile(f[0]); setRot(0); setFlipH(false); setFlipV(false); } catch { setError("Could not read this image."); }
  };
  const save = async () => {
    const jpg = file!.type === "image/jpeg", c = render();
    download(await canvasToBlob(c, jpg ? "image/jpeg" : "image/png", 0.95), file!.name.replace(/\.[^.]+$/, "") + "-rotated." + (jpg ? "jpg" : "png"));
  };
  const turn = (d: number) => setRot((r) => (r + d + 360) % 360);

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={load} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {img && file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => turn(-90)}><RotateCcw className="h-4 w-4" /> Left 90°</button>
            <button className="btn-ghost" onClick={() => turn(90)}><RotateCw className="h-4 w-4" /> Right 90°</button>
            <button className="btn-ghost" onClick={() => turn(180)}>Turn 180°</button>
            <button className={flipH ? "btn" : "btn-ghost"} aria-pressed={flipH} onClick={() => setFlipH(!flipH)}><FlipHorizontal2 className="h-4 w-4" /> Flip left-right</button>
            <button className={flipV ? "btn" : "btn-ghost"} aria-pressed={flipV} onClick={() => setFlipV(!flipV)}><FlipVertical2 className="h-4 w-4" /> Flip up-down</button>
          </div>
          <canvas ref={view} aria-label="Preview" className="mx-auto block max-h-96 w-auto max-w-full rounded-lg border" />
          <p className="text-sm text-neutral-600" data-info="1">{rot % 180 ? `${img.height} × ${img.width}` : `${img.width} × ${img.height}`} px · {formatBytes(file.size)} original · turned {rot}°{flipH ? " · flipped left-right" : ""}{flipV ? " · flipped up-down" : ""}</p>
          <button className="btn w-full" onClick={save}>Download picture</button>
        </div>
      )}
    </div>
  );
}
