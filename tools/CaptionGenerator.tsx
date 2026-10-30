"use client";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import CopyButton from "@/components/CopyButton";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { callAi } from "@/lib/ai";
import { canvasToBlob, loadImage } from "@/lib/files";

const blobToDataUrl = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(b); });

export default function CaptionGenerator() {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("social");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setOut("");
    try {
      // Downscale first so uploads stay small and fast.
      const img = await loadImage(file!), s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      setOut(await callAi({ action: "caption", style, image: await blobToDataUrl(await canvasToBlob(c, "image/jpeg", 0.85)) }));
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <AiNotice />
      <Dropzone accept="image/*" onFiles={(f) => { if (f[0]) { setFile(f[0]); setPreview(URL.createObjectURL(f[0])); setOut(""); } }} />
      {preview && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected" className="max-h-64 rounded border" />
          <div className="flex flex-wrap gap-3">
            <select className="input !w-auto" value={style} onChange={(e) => setStyle(e.target.value)}><option value="social">Social media captions</option><option value="alt">Alt text</option><option value="descriptive">Detailed description</option></select>
            <button className="btn" disabled={busy} onClick={run}>{busy ? "Writing…" : "Generate caption"}</button>
          </div>
          <WaterLoader active={busy} label="Looking at your photo…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {out && <div className="space-y-2"><div className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-sm">{out}</div><CopyButton text={out} /></div>}
        </div>
      )}
    </div>
  );
}
