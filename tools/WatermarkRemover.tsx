"use client";
import { useEffect, useRef, useState } from "react";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";

interface Rect { x: number; y: number; w: number; h: number }

/** Onion-peel inpainting: fill masked pixels from the outside in using the average of known neighbours. */
function inpaint(data: ImageData, rects: Rect[]) {
  const { width: W, height: H } = data;
  const px = data.data;
  const unknown = new Uint8Array(W * H);
  for (const r of rects)
    for (let y = Math.max(0, r.y); y < Math.min(H, r.y + r.h); y++)
      for (let x = Math.max(0, r.x); x < Math.min(W, r.x + r.w); x++) unknown[y * W + x] = 1;

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  let remaining = unknown.reduce((a, b) => a + b, 0);
  while (remaining > 0) {
    const filled: number[] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!unknown[i]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || unknown[ny * W + nx]) continue;
        const j = (ny * W + nx) * 4;
        r += px[j]; g += px[j + 1]; b += px[j + 2]; n++;
      }
      if (n) { const k = i * 4; px[k] = r / n; px[k + 1] = g / n; px[k + 2] = b / n; px[k + 3] = 255; filled.push(i); }
    }
    if (!filled.length) break; // nothing known at all (whole image selected)
    for (const i of filled) unknown[i] = 0;
    remaining -= filled.length;
  }

  // Smooth the filled area so the patch blends in instead of showing layer rings.
  for (let pass = 0; pass < 6; pass++)
    for (const rc of rects)
      for (let y = Math.max(1, rc.y); y < Math.min(H - 1, rc.y + rc.h); y++)
        for (let x = Math.max(1, rc.x); x < Math.min(W - 1, rc.x + rc.w); x++) {
          const k = (y * W + x) * 4;
          for (let c = 0; c < 3; c++)
            px[k + c] = (px[k + c] * 4 + px[k + c - 4] + px[k + c + 4] + px[k + c - W * 4] + px[k + c + W * 4]) / 8;
        }
}

export default function WatermarkRemover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drag, setDrag] = useState<Rect | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const baseRef = useRef<ImageData | null>(null);

  const ctx = () => canvasRef.current!.getContext("2d")!;

  const pick = async (files: File[]) => {
    if (!files[0]) return;
    const img = await loadImage(files[0]);
    const c = canvasRef.current!;
    c.width = img.width; c.height = img.height;
    ctx().drawImage(img, 0, 0);
    baseRef.current = null; setHistory([]); setRects([]); setLoaded(true);
  };

  // Redraw selection overlays on top of the current pixels.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !loaded) return;
    const g = c.getContext("2d")!;
    if (baseRef.current) g.putImageData(baseRef.current, 0, 0);
    else baseRef.current = g.getImageData(0, 0, c.width, c.height);
    g.lineWidth = Math.max(2, c.width / 300);
    g.strokeStyle = "#ef4444"; g.fillStyle = "rgba(239,68,68,.25)";
    for (const r of [...rects, ...(drag ? [drag] : [])]) { g.fillRect(r.x, r.y, r.w, r.h); g.strokeRect(r.x, r.y, r.w, r.h); }
  }, [rects, drag, loaded]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!, b = c.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height };
  };
  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
    x: Math.round(Math.min(a.x, b.x)), y: Math.round(Math.min(a.y, b.y)),
    w: Math.round(Math.abs(a.x - b.x)), h: Math.round(Math.abs(a.y - b.y)),
  });

  const remove = () => {
    const c = canvasRef.current!;
    const data = new ImageData(new Uint8ClampedArray(baseRef.current!.data), c.width, c.height);
    setHistory((h) => [...h, baseRef.current!]);
    setBusy(true);
    setTimeout(() => { // let the "working" state paint first
      inpaint(data, rects.map((r) => ({ x: r.x - 1, y: r.y - 1, w: r.w + 2, h: r.h + 2 })));
      baseRef.current = data; setRects([]); setBusy(false);
    }, 30);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    baseRef.current = prev; setHistory(history.slice(0, -1)); setRects([]);
  };

  const save = async () => {
    const c = canvasRef.current!;
    const out = document.createElement("canvas"); out.width = c.width; out.height = c.height;
    out.getContext("2d")!.putImageData(baseRef.current!, 0, 0);
    download(await canvasToBlob(out, "image/png"), "watermark-removed.png");
  };

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 rounded-xl border border-neutral-300 bg-neutral-100 p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I own this image or have permission to edit it. I will not use this tool to remove watermarks from content I don&apos;t have rights to.</span>
      </label>
      {agreed && <Dropzone accept="image/*" onFiles={pick} hint="Then drag a box over the watermark. Works best on plain or softly textured backgrounds." />}
      <div className={loaded && agreed ? "space-y-3 rounded-xl border bg-white p-3" : "hidden"}>
        <p className="text-sm text-neutral-600">Drag over each watermark to select it, then press Remove.</p>
        <canvas
          ref={canvasRef}
          className="max-h-[70vh] w-full touch-none rounded-lg border object-contain"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = pos(e); }}
          onPointerMove={(e) => { if (start.current) setDrag(norm(start.current, pos(e))); }}
          onPointerUp={(e) => {
            if (!start.current) return;
            const r = norm(start.current, pos(e)); start.current = null; setDrag(null);
            if (r.w > 3 && r.h > 3) setRects((p) => [...p, r]);
          }}
        />
        <WaterLoader active={busy} label="Erasing the watermark…" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button className="btn" disabled={!rects.length || busy} onClick={remove}>{busy ? "Working…" : "Remove"}</button>
          <button className="btn-ghost" disabled={!rects.length} onClick={() => setRects([])}>Clear boxes</button>
          <button className="btn-ghost" disabled={!history.length} onClick={undo}>Undo</button>
          <button className="btn" disabled={!history.length} onClick={save}>Download</button>
        </div>
      </div>
    </div>
  );
}
