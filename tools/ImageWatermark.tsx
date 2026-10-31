"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { JobStatus, PartsList, useJob, type Part } from "@/components/PdfShell";
import { canvasToBlob, loadImage } from "@/lib/files";

type Pos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br" | "tile";
const grid: Pos[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
interface Opts { kind: "text" | "logo"; text: string; color: string; size: number; opacity: number; angle: number; pos: Pos }

function drawMark(g: CanvasRenderingContext2D, w: number, h: number, o: Opts, logo: HTMLImageElement | null) {
  const base = Math.min(w, h), unit = (o.size / 100) * base;
  let mw: number, mh: number;
  const paint = (x: number, y: number) => {
    g.save(); g.globalAlpha = o.opacity / 100; g.translate(x, y); g.rotate((o.angle * Math.PI) / 180);
    if (o.kind === "logo" && logo) g.drawImage(logo, -mw / 2, -mh / 2, mw, mh);
    else { g.fillStyle = o.color; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold ${unit}px sans-serif`; g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = unit / 12; g.fillText(o.text, 0, 0); }
    g.restore();
  };
  if (o.kind === "logo") { if (!logo) return; mw = unit * 3; mh = (logo.height / logo.width) * mw; }
  else { g.font = `bold ${unit}px sans-serif`; mw = g.measureText(o.text).width; mh = unit; }
  if (o.kind === "text" && !o.text.trim()) return;
  if (o.pos === "tile") {
    const sx = mw * 1.5 + 20, sy = mh * 3 + 20;
    for (let r = 0, y = sy / 2; y < h + sy; y += sy, r++) for (let x = (r % 2 ? sx / 2 : 0); x < w + sx; x += sx) paint(x, y);
    return;
  }
  const pad = base * 0.04, col = o.pos[1], row = o.pos[0];
  const x = col === "l" ? pad + mw / 2 : col === "r" ? w - pad - mw / 2 : w / 2;
  const y = row === "t" ? pad + mh / 2 : row === "b" ? h - pad - mh / 2 : h / 2;
  paint(x, y);
}

export default function ImageWatermark() {
  const [files, setFiles] = useState<File[]>([]);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [o, setO] = useState<Opts>({ kind: "text", text: "© Your name", color: "#ffffff", size: 6, opacity: 60, angle: 0, pos: "br" });
  const [parts, setParts] = useState<Part[]>([]);
  const { busy, error, run } = useJob();
  const preview = useRef<HTMLCanvasElement>(null);
  const first = files[0];

  useEffect(() => {
    if (!first || !preview.current) return;
    let cancel = false;
    loadImage(first).then((img) => {
      if (cancel || !preview.current) return;
      const k = Math.min(1, 700 / Math.max(img.width, img.height)), c = preview.current;
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext("2d")!; g.drawImage(img, 0, 0, c.width, c.height); drawMark(g, c.width, c.height, o, logo);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [first, o, logo]);

  const pickLogo = async (f: File[]) => { if (f[0]) setLogo(await loadImage(f[0])); };
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((p) => ({ ...p, [k]: v }));

  const apply = () => run(async () => {
    const out: Part[] = [];
    for (const f of files) {
      const img = await loadImage(f), c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d")!; g.drawImage(img, 0, 0); drawMark(g, c.width, c.height, o, logo);
      const jpg = f.type === "image/jpeg";
      const blob = await canvasToBlob(c, jpg ? "image/jpeg" : "image/png", 0.93);
      out.push({ name: f.name.replace(/\.[^.]+$/, "") + "-watermarked." + (jpg ? "jpg" : "png"), bytes: new Uint8Array(await blob.arrayBuffer()), type: jpg ? "image/jpeg" : "image/png" });
    }
    setParts(out);
  });

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={(f) => { setFiles(f); setParts([]); }} hint="Add one or many pictures. They stay on your device." />
      {first && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex gap-2">{(["text", "logo"] as const).map((k) => <button key={k} className={o.kind === k ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => set("kind", k)}>{k === "text" ? "Text" : "Logo"}</button>)}</div>
          {o.kind === "text" ? (
            <div className="grid grid-cols-[1fr_auto] gap-2"><input className="input" aria-label="Watermark text" value={o.text} onChange={(e) => set("text", e.target.value)} /><input type="color" aria-label="Text colour" value={o.color} onChange={(e) => set("color", e.target.value)} /></div>
          ) : <Dropzone accept="image/*" onFiles={pickLogo} hint="Add your logo (a PNG with a clear background works best)." />}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium">Size: {o.size}%<input type="range" min={2} max={25} value={o.size} onChange={(e) => set("size", +e.target.value)} className="w-full" aria-label="Size" /></label>
            <label className="text-sm font-medium">Opacity: {o.opacity}%<input type="range" min={10} max={100} value={o.opacity} onChange={(e) => set("opacity", +e.target.value)} className="w-full" aria-label="Opacity" /></label>
            <label className="text-sm font-medium">Angle: {o.angle}°<input type="range" min={-90} max={90} value={o.angle} onChange={(e) => set("angle", +e.target.value)} className="w-full" aria-label="Angle" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid grid-cols-3 gap-1" role="group" aria-label="Position">{grid.map((p) => <button key={p} aria-label={`Position ${p}`} aria-pressed={o.pos === p} className={`h-8 w-8 rounded border ${o.pos === p ? "bg-black dark:bg-white" : "bg-neutral-100 dark:bg-neutral-800"}`} onClick={() => set("pos", p)} />)}</div>
            <button className={o.pos === "tile" ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => set("pos", "tile")}>Repeat across the picture</button>
          </div>
          <canvas ref={preview} aria-label="Watermark preview" className="mx-auto block max-h-96 w-auto max-w-full rounded-lg border" />
          <button className="btn w-full" disabled={busy || (o.kind === "logo" && !logo)} onClick={apply}>{`Add watermark to ${files.length} picture${files.length === 1 ? "" : "s"}`}</button>
        </div>
      )}
      <JobStatus busy={busy} error={error} label="Adding the watermark…" />
      {parts.length > 0 && <PartsList parts={parts} zipName="watermarked-images.zip" />}
    </div>
  );
}
