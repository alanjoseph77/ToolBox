"use client";
import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { removeBg } from "@/lib/bgremoval";

const DPI = 300;
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);
const presets = [
  { label: "India passport / visa (35×45 mm)", w: 35, h: 45 },
  { label: "US passport / visa (51×51 mm)", w: 51, h: 51 },
  { label: "Stamp size (25×35 mm)", w: 25, h: 35 },
  { label: "Square ID (35×35 mm)", w: 35, h: 35 },
];
const sheets = [
  { label: "4×6 in", w: 1200, h: 1800 },
  { label: "A4", w: 2480, h: 3508 },
];
const bgOptions = ["#ffffff", "#e8f0fe", "#d9e7f7", "#f3f4f6"];

export default function PassportPhoto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preset, setPreset] = useState(presets[0]);
  const [bg, setBg] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cutout, setCutout] = useState(false);
  const [sheet, setSheet] = useState(sheets[0]);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const fw = mmToPx(preset.w), fh = mmToPx(preset.h);

  const draw = (c: HTMLCanvasElement, imageEl: HTMLImageElement, w: number, h: number) => {
    c.width = w; c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const base = Math.max(w / imageEl.width, h / imageEl.height) * zoom;
    const dw = imageEl.width * base, dh = imageEl.height * base;
    // offsets are stored as fractions of the frame so preview and export agree
    g.imageSmoothingQuality = "high";
    g.drawImage(imageEl, (w - dw) / 2 + off.x * w, (h - dh) / 2 + off.y * h, dw, dh);
  };

  useEffect(() => { if (img && canvasRef.current) draw(canvasRef.current, img, fw, fh); }); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    setImg(await loadImage(f[0])); setZoom(1); setOff({ x: 0, y: 0 }); setCutout(false); setError("");
  };

  const whiten = async () => {
    setBusy(true); setError("");
    try {
      const c = document.createElement("canvas"); c.width = img!.width; c.height = img!.height;
      c.getContext("2d")!.drawImage(img!, 0, 0);
      setImg(await loadImage(await removeBg(await canvasToBlob(c, "image/png")))); setCutout(true);
    } catch { setError("Background removal failed. You can still crop and download with the original background."); }
    setBusy(false);
  };

  const onDown = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const b = canvasRef.current!.getBoundingClientRect();
    setOff({ x: drag.current.ox + (e.clientX - drag.current.x) / b.width, y: drag.current.oy + (e.clientY - drag.current.y) / b.height });
  };

  const photo = () => { const c = document.createElement("canvas"); draw(c, img!, fw, fh); return c; };

  const buildSheet = () => {
    const p = photo(), c = document.createElement("canvas"); c.width = sheet.w; c.height = sheet.h;
    const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    const gap = mmToPx(2), margin = mmToPx(5);
    const cols = Math.max(1, Math.floor((c.width - 2 * margin + gap) / (fw + gap)));
    const rows = Math.max(1, Math.floor((c.height - 2 * margin + gap) / (fh + gap)));
    const x0 = (c.width - (cols * fw + (cols - 1) * gap)) / 2, y0 = margin;
    g.strokeStyle = "#bbb"; g.lineWidth = 2;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const x = x0 + k * (fw + gap), y = y0 + r * (fh + gap);
      g.drawImage(p, x, y); g.strokeRect(x, y, fw, fh);
    }
    return { canvas: c, count: rows * cols };
  };

  const saveSheet = async (kind: "png" | "pdf") => {
    const { canvas } = buildSheet();
    if (kind === "png") { download(await canvasToBlob(canvas, "image/png"), "passport-sheet.png"); return; }
    const pdf = await PDFDocument.create();
    const emb = await pdf.embedJpg(new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", 0.95)).arrayBuffer()));
    const page = pdf.addPage([(canvas.width / DPI) * 72, (canvas.height / DPI) * 72]);
    page.drawImage(emb, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    download(await pdf.save(), "passport-sheet.pdf", "application/pdf");
  };

  const count = img ? buildSheetCount() : 0;
  function buildSheetCount() {
    const gap = mmToPx(2), margin = mmToPx(5);
    return Math.max(1, Math.floor((sheet.w - 2 * margin + gap) / (fw + gap))) * Math.max(1, Math.floor((sheet.h - 2 * margin + gap) / (fh + gap)));
  }

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={pick} hint="Use a front-facing photo with even lighting. Everything stays on your device." />
      {img && (
        <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-2">
          <div className="space-y-2">
            <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}
              className="mx-auto max-h-[60vh] w-full max-w-xs touch-none cursor-move rounded border" style={{ aspectRatio: `${fw}/${fh}` }} />
            <p className="text-center text-xs text-neutral-500">Drag to position · {fw}×{fh}px @ 300 DPI</p>
          </div>
          <div className="space-y-3">
            <div><label className="label">Photo size</label>
              <select className="input" value={preset.label} onChange={(e) => setPreset(presets.find((p) => p.label === e.target.value)!)}>{presets.map((p) => <option key={p.label}>{p.label}</option>)}</select></div>
            <div><label className="label">Zoom: {zoom.toFixed(2)}×</label><input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-full" /></div>
            <div><label className="label">Background</label>
              <div className="flex items-center gap-2">{bgOptions.map((c) => <button key={c} aria-label={c} onClick={() => setBg(c)} className={`h-8 w-8 rounded-full border-2 ${bg === c ? "border-brand-600" : "border-neutral-300"}`} style={{ background: c }} />)}
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-8" aria-label="Custom colour" /></div></div>
            <button className="btn-ghost w-full" disabled={busy || cutout} onClick={whiten}>{busy ? "Removing background…" : cutout ? "✓ Background removed" : "Remove background"}</button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn w-full" onClick={async () => download(await canvasToBlob(photo(), "image/jpeg", 0.95), "passport-photo.jpg")}>Download single photo</button>
            <div className="space-y-2 border-t pt-3">
              <label className="label">Print sheet ({count} photos)</label>
              <div className="flex gap-2">{sheets.map((s) => <button key={s.label} className={s === sheet ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setSheet(s)}>{s.label}</button>)}</div>
              <div className="grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => saveSheet("png")}>Sheet PNG</button><button className="btn-ghost" onClick={() => saveSheet("pdf")}>Sheet PDF</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
