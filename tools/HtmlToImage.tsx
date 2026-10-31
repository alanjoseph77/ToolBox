"use client";
import { useRef, useState } from "react";
import { canvasToBlob, download } from "@/lib/files";
import { htmlToCanvas } from "@/lib/htmlRender";

const SAMPLE = `<div style="font-family:sans-serif;padding:24px;background:#fff7ed;border-radius:16px">
  <h1 style="margin:0 0 8px">Hello from ToolBox</h1>
  <p style="margin:0;color:#444">Turn this HTML into a picture.</p>
</div>`;

export default function HtmlToImage() {
  const [html, setHtml] = useState(SAMPLE);
  const [width, setWidth] = useState(800);
  const [scale, setScale] = useState(2);
  const [bg, setBg] = useState("#ffffff");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);

  const render = () => htmlToCanvas(html, width, scale, bg);

  const make = async (type?: "image/png" | "image/jpeg") => {
    setBusy(true); setError("");
    try {
      const c = await render();
      const p = preview.current!; p.width = c.width; p.height = c.height; p.getContext("2d")!.drawImage(c, 0, 0);
      setInfo(`${c.width} × ${c.height} px`);
      if (type) download(await canvasToBlob(c, type, 0.92), `html-image.${type === "image/png" ? "png" : "jpg"}`);
    } catch { setError("Could not turn this HTML into an image. Check that the HTML is valid. Pictures and fonts from other websites are not loaded; use inline styles or data: images."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <label className="block text-sm font-medium">Your HTML
          <textarea className="input mt-1 h-56 w-full font-mono text-xs" aria-label="HTML" value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} /></label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">Width (px)<input type="number" min={100} max={3000} className="input mt-1 !w-28" aria-label="Width" value={width} onChange={(e) => setWidth(Math.min(3000, Math.max(100, +e.target.value || 800)))} /></label>
          <label className="text-sm font-medium">Sharpness<select className="input mt-1 !w-28" aria-label="Sharpness" value={scale} onChange={(e) => setScale(+e.target.value)}><option value={1}>1×</option><option value={2}>2×</option><option value={3}>3×</option></select></label>
          <label className="text-sm font-medium">Background <input type="color" aria-label="Background colour" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-ghost" disabled={busy} onClick={() => make()}>Preview</button>
          <button className="btn" disabled={busy} onClick={() => make("image/png")}>Download PNG</button>
          <button className="btn-ghost" disabled={busy} onClick={() => make("image/jpeg")}>Download JPG</button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className={info ? "space-y-1" : "hidden"}>
        <p className="text-xs text-neutral-500" role="status">{info}</p>
        <canvas ref={preview} aria-label="Image preview" className="w-full max-w-2xl rounded-lg border bg-white" />
      </div>
      <p className="text-xs text-neutral-500">Paste your own HTML and CSS. Scripts are ignored, and pictures or fonts from other websites are not loaded.</p>
    </div>
  );
}
