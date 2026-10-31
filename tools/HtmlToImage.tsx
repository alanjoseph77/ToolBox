"use client";
import { useRef, useState } from "react";
import { canvasToBlob, download } from "@/lib/files";

const SAMPLE = `<div style="font-family:sans-serif;padding:24px;background:#fff7ed;border-radius:16px">
  <h1 style="margin:0 0 8px">Hello from ToolBox</h1>
  <p style="margin:0;color:#444">Turn this HTML into a picture.</p>
</div>`;

/** Renders the HTML in a hidden, sandboxed frame so its styles can't touch this page, then serialises it for SVG. */
async function snapshot(html: string, width: number): Promise<{ markup: string; height: number }> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  Object.assign(frame.style, { position: "fixed", left: "-99999px", top: "0", width: `${width}px`, height: "10px", border: "0" });
  document.body.appendChild(frame);
  try {
    await new Promise<void>((res) => { frame.onload = () => res(); frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`; });
    const d = frame.contentDocument!;
    const height = Math.max(20, Math.ceil(d.documentElement.scrollHeight));
    const xs = new XMLSerializer();
    d.querySelectorAll("script").forEach((s) => s.remove());
    const styles = [...d.querySelectorAll("style")].map((s) => xs.serializeToString(s)).join("");
    const body = xs.serializeToString(d.body);
    return { markup: `${styles}${body}`, height };
  } finally { frame.remove(); }
}

export default function HtmlToImage() {
  const [html, setHtml] = useState(SAMPLE);
  const [width, setWidth] = useState(800);
  const [scale, setScale] = useState(2);
  const [bg, setBg] = useState("#ffffff");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);

  const render = async (): Promise<HTMLCanvasElement> => {
    const { markup, height } = await snapshot(html, width);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px">${markup}</div></foreignObject></svg>`;
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("render")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const c = document.createElement("canvas"); c.width = width * scale; c.height = height * scale;
    const g = c.getContext("2d")!; g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  };

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
