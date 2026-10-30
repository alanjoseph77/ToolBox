"use client";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { removeBg } from "@/lib/bgremoval";
import { callAi } from "@/lib/ai";

type Bg = { kind: "color"; c1: string } | { kind: "gradient"; c1: string; c2: string } | { kind: "image"; img: HTMLImageElement };
const swatches = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const ideas = ["Sunset over a calm ocean", "Modern minimalist office", "Starry night sky with mountains", "Soft pastel studio backdrop", "Green forest with morning light"];

export default function BackgroundStudio({ ai = false }: { ai?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [subject, setSubject] = useState<HTMLImageElement | null>(null);
  const [bg, setBg] = useState<Bg>({ kind: "color", c1: "#3b82f6" });
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);

  useEffect(() => { if (ai) fetch("/api/ai").then((r) => r.json()).then((d) => setConfigured(d.configured)).catch(() => {}); }, [ai]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !subject) return;
    c.width = subject.width; c.height = subject.height;
    const g = c.getContext("2d")!;
    if (bg.kind === "color") { g.fillStyle = bg.c1; g.fillRect(0, 0, c.width, c.height); }
    else if (bg.kind === "gradient") { const gr = g.createLinearGradient(0, 0, c.width, c.height); gr.addColorStop(0, bg.c1); gr.addColorStop(1, bg.c2); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); }
    else { const s = Math.max(c.width / bg.img.width, c.height / bg.img.height); g.drawImage(bg.img, (c.width - bg.img.width * s) / 2, (c.height - bg.img.height * s) / 2, bg.img.width * s, bg.img.height * s); }
    g.drawImage(subject, 0, 0);
  }, [subject, bg]);

  const pick = async (f: File[]) => {
    if (!f[0]) return;
    setError(""); setSubject(null); setStatus("Removing background… the first run downloads the AI model (~40 MB).");
    try { setSubject(await loadImage(await removeBg(f[0]))); setStatus(""); }
    catch { setStatus(""); setError("Background removal failed. Try a smaller image or another browser."); }
  };

  const generate = async () => {
    setError(""); setStatus("Painting your scene…");
    try {
      const svg = await callAi<string>({ action: "background", prompt });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      setBg({ kind: "image", img: await loadImage(await (await fetch(url)).blob()) });
    } catch (e) { setError((e as Error).message); }
    setStatus("");
  };

  const save = async (type: "image/png" | "image/jpeg") =>
    download(await canvasToBlob(canvasRef.current!, type, 0.95), type === "image/png" ? "new-background.png" : "new-background.jpg");

  return (
    <div className="space-y-4">
      {ai && !configured && <p className="rounded-lg bg-neutral-100 p-3 text-sm text-neutral-800">AI scene generation isn&apos;t configured on this server yet (set <code>ANTHROPIC_API_KEY</code>). You can still use colours, gradients and your own images.</p>}
      <Dropzone accept="image/*" onFiles={pick} hint="Upload a photo with a clear subject. The background is removed on your device." />
      {status && <p className="text-sm text-neutral-500">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {subject && (
        <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-2">
          <canvas ref={canvasRef} className="max-h-[60vh] w-full rounded border object-contain" />
          <div className="space-y-3">
            {ai && (
              <div className="space-y-2">
                <label className="label">Describe the background</label>
                <textarea className="input h-20" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Sunset over a calm ocean" />
                <div className="flex flex-wrap gap-1">{ideas.map((i) => <button key={i} className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setPrompt(i)}>{i}</button>)}</div>
                <button className="btn w-full" disabled={prompt.trim().length < 3 || !!status} onClick={generate}>Generate scene</button>
              </div>
            )}
            <div><label className="label">Solid colour</label>
              <div className="flex flex-wrap items-center gap-2">{swatches.map((c) => <button key={c} aria-label={c} onClick={() => setBg({ kind: "color", c1: c })} className="h-8 w-8 rounded-full border" style={{ background: c }} />)}
                <input type="color" aria-label="Custom colour" className="h-8 w-8" onChange={(e) => setBg({ kind: "color", c1: e.target.value })} /></div></div>
            <div><label className="label">Gradient</label>
              <div className="flex gap-2">{[["#3b82f6", "#8b5cf6"], ["#f97316", "#ec4899"], ["#22c55e", "#0ea5e9"], ["#0f172a", "#475569"]].map(([a, b]) => (
                <button key={a} aria-label={`${a} to ${b}`} onClick={() => setBg({ kind: "gradient", c1: a, c2: b })} className="h-8 w-12 rounded border" style={{ background: `linear-gradient(135deg,${a},${b})` }} />))}</div></div>
            <div><label className="label">Your own image</label>
              <input type="file" accept="image/*" className="text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setBg({ kind: "image", img: await loadImage(f) }); }} /></div>
            <div className="grid grid-cols-2 gap-2"><button className="btn" onClick={() => save("image/png")}>Download PNG</button><button className="btn-ghost" onClick={() => save("image/jpeg")}>Download JPG</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
