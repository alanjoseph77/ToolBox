"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { removeBg } from "@/lib/bgremoval";

export default function RemoveBackground() {
  const [src, setSrc] = useState("");
  const [out, setOut] = useState<Blob | null>(null);
  const [outUrl, setOutUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setSrc(URL.createObjectURL(f)); setOut(null); setOutUrl(""); setError(""); setBusy(true);
    try {
      const blob = await removeBg(f);
      setOut(blob); setOutUrl(URL.createObjectURL(blob));
    } catch { setError("Background removal failed. Try a smaller image or another browser."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={run} hint="The AI model runs on your device. First use downloads it (~40 MB)." />
      {busy && <p className="text-sm text-neutral-500">Removing background… the first run can take a minute.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {src && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Original" className="rounded-xl border bg-white" />
          {outUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={outUrl} alt="Result" className="rounded-xl border bg-[conic-gradient(#e2e8f0_25%,#fff_0_50%,#e2e8f0_0_75%,#fff_0)] bg-[length:20px_20px]" />
          )}
        </div>
      )}
      {out && <button className="btn w-full" onClick={() => download(out, "no-background.png")}>Download PNG</button>}
    </div>
  );
}
