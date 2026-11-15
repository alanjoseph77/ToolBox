"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { makeZip } from "@/lib/zip";

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];
const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

/** .ico file that holds PNG images (supported by every current browser). */
function ico(images: { size: number; data: Uint8Array }[]): Uint8Array {
  const head = 6 + 16 * images.length, total = head + images.reduce((n, i) => n + i.data.length, 0), out = new Uint8Array(total), v = new DataView(out.buffer);
  v.setUint16(2, 1, true); v.setUint16(4, images.length, true);
  let off = head;
  images.forEach((im, k) => { const e = 6 + 16 * k; out[e] = im.size >= 256 ? 0 : im.size; out[e + 1] = out[e]; v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true); v.setUint32(e + 8, im.data.length, true); v.setUint32(e + 12, off, true); out.set(im.data, off); off += im.data.length; });
  return out;
}

export default function FaviconGenerator() {
  const [res, setRes] = useState<{ size: number; url: string; data: Uint8Array }[]>([]);
  const [round, setRound] = useState(false);
  const [bgc, setBgc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [src, setSrc] = useState<File | null>(null);

  const make = async (f: File, r = round, bg = bgc) => {
    setBusy(true); setError("");
    try {
      const img = await loadImage(f), out = [];
      for (const s of SIZES) {
        const c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d")!; g.imageSmoothingQuality = "high";
        if (r) { g.beginPath(); g.roundRect(0, 0, s, s, s * 0.22); g.clip(); }
        if (bg) { g.fillStyle = bg; g.fillRect(0, 0, s, s); }
        const k = Math.min(s / img.width, s / img.height) * (bg ? 0.84 : 1), w = img.width * k, h = img.height * k;   // fit inside the square, no distortion
        g.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        const b = await canvasToBlob(c, "image/png"); out.push({ size: s, url: URL.createObjectURL(b), data: await bytes(b) });
      }
      setRes(out);
    } catch { setError("Could not read this image."); setRes([]); }
    setBusy(false);
  };
  const html = `<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">`;
  const manifest = JSON.stringify({ name: "My site", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }] }, null, 2);
  const zip = () => {
    const by = (s: number) => res.find((r) => r.size === s)!.data, enc = (t: string) => new TextEncoder().encode(t);
    download(makeZip([
      { name: "favicon.ico", data: ico([16, 32, 48].map((s) => ({ size: s, data: by(s) }))) }, { name: "favicon-16x16.png", data: by(16) }, { name: "favicon-32x32.png", data: by(32) },
      { name: "apple-touch-icon.png", data: by(180) }, { name: "android-chrome-192x192.png", data: by(192) }, { name: "android-chrome-512x512.png", data: by(512) },
      { name: "site.webmanifest", data: enc(manifest) }, { name: "add-to-head.html", data: enc(html) },
    ]), "favicons.zip", "application/zip");
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={(f) => { setSrc(f[0]); make(f[0]); }} hint="Use a square or simple logo. PNG with a transparent background works best." />
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-3 text-sm">
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={round} onChange={(e) => { setRound(e.target.checked); src && make(src, e.target.checked, bgc); }} /> Rounded corners</label>
        <label className="flex items-center gap-2">Background <select className="rounded-lg border px-2 py-2" value={bgc} onChange={(e) => { setBgc(e.target.value); src && make(src, round, e.target.value); }}><option value="">Transparent</option><option value="#ffffff">White</option><option value="#000000">Black</option><option value="#2563eb">Blue</option></select></label>
      </div>
      {busy && <p className="text-sm text-neutral-500">Creating icons…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {res.length > 0 && !busy && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-[conic-gradient(#e2e8f0_25%,#fff_0_50%,#e2e8f0_0_75%,#fff_0)] bg-[length:16px_16px] p-3" data-testid="favicons">
            {res.map((r) => (
              <div key={r.size} className="text-center text-xs"> {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={`${r.size}px`} style={{ width: Math.min(r.size, 96), height: Math.min(r.size, 96) }} /><span className="rounded bg-white/80 px-1">{r.size}</span></div>
            ))}
          </div>
          <button className="btn w-full" onClick={zip}>Download all (ZIP)</button>
          <details className="rounded-xl border bg-white p-3 text-sm"><summary className="cursor-pointer font-medium">Code to paste in your site&apos;s &lt;head&gt;</summary><pre className="mt-2 overflow-x-auto text-xs">{html}</pre></details>
        </div>
      )}
    </div>
  );
}
