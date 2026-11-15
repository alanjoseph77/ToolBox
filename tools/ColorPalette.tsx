"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { loadImage } from "@/lib/files";

const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export default function ColorPalette() {
  const [cols, setCols] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [n, setN] = useState(6);
  const [copied, setCopied] = useState("");
  const [data, setData] = useState<Uint8ClampedArray | null>(null);

  const pick = (d: Uint8ClampedArray, count: number) => {
    const bins = new Map<number, [number, number, number, number]>();           // 4-bit buckets, then merge near neighbours
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue; const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4), e = bins.get(k) ?? [0, 0, 0, 0];
      e[0] += d[i]; e[1] += d[i + 1]; e[2] += d[i + 2]; e[3]++; bins.set(k, e);
    }
    const list = [...bins.values()].sort((a, b) => b[3] - a[3]).map((e) => [e[0] / e[3], e[1] / e[3], e[2] / e[3]]);
    const out: number[][] = [];
    for (const c of list) { if (out.every((o) => dist(o, c) > 48)) out.push(c); if (out.length === count) break; }
    setCols(out.map(([r, g, b]) => hex(Math.round(r), Math.round(g), Math.round(b))));
  };
  const open = async (f: File[]) => {
    const img = await loadImage(f[0]), k = Math.min(1, 160 / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext("2d", { willReadFrequently: true })!; g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; setData(d); setUrl(URL.createObjectURL(f[0])); pick(d, n);
  };
  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => {}); setCopied(t); setTimeout(() => setCopied(""), 1200); };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={open} />
      {url && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Your image" className="max-h-48 rounded-xl border" />
            <label className="flex items-center gap-2 text-sm">Colours <select className="rounded-lg border px-2 py-2" value={n} onChange={(e) => { setN(+e.target.value); data && pick(data, +e.target.value); }}>{[3, 4, 5, 6, 8, 10].map((v) => <option key={v}>{v}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="palette">
            {cols.map((c) => (
              <button key={c} onClick={() => copy(c)} className="overflow-hidden rounded-xl border bg-white text-left" aria-label={`Copy ${c}`}>
                <div className="h-20" style={{ background: c }} /><div className="p-2 text-sm font-mono">{copied === c ? "Copied!" : c.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => copy(cols.join(", "))}>Copy all HEX</button>
            <button className="btn-ghost" onClick={() => copy(`:root {\n${cols.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`)}>Copy as CSS</button>
          </div>
        </div>
      )}
    </div>
  );
}
