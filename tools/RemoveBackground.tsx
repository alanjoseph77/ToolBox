"use client";
import { useState } from "react";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";
import { removeBg } from "@/lib/bgremoval";
import { looksFlat, removeFlatBg } from "@/lib/flatbg";

export default function RemoveBackground() {
  const [src, setSrc] = useState("");
  const [out, setOut] = useState<Blob | null>(null);
  const [outUrl, setOutUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"graphic" | "photo">("photo");
  const [tol, setTol] = useState(40);
  const [holes, setHoles] = useState(true);

  const process = async (f: File, m: "graphic" | "photo", t: number, h: boolean) => {
    setBusy(true); setError("");
    try {
      const blob = m === "graphic" ? await removeFlatBg(f, t, h) : await removeBg(f);
      setOut(blob); setOutUrl(URL.createObjectURL(blob));
    } catch { setError("Background removal failed. Try a smaller image or another browser."); }
    setBusy(false);
  };

  const run = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setSrc(URL.createObjectURL(f)); setOut(null); setOutUrl(""); setFile(f);
    const m = (await looksFlat(f)) ? "graphic" : "photo";   // logo / text on a plain colour: keep the text, remove only the colour
    setMode(m); await process(f, m, tol, holes);
  };
  const again = (m: "graphic" | "photo", t = tol, h = holes) => { setMode(m); setTol(t); setHoles(h); if (file) process(file, m, t, h); };

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" onFiles={run} hint="The AI model runs on your device. First use downloads it (~40 MB)." />
      {busy && <p className="text-sm text-neutral-500">Removing background… the first run can take a minute.</p>}
      <WaterLoader active={busy} label="Removing the background…" hints={["First run downloads the AI model (~40 MB)", "Then it is much faster", "Almost there…"]} />
          {error && <p className="text-sm text-red-600">{error}</p>}
      {file && !busy && (
        <div className="rounded-xl border bg-white p-3 text-sm space-y-2" data-testid="bg-mode">
          <div className="flex flex-wrap gap-2">
            <button className={`btn-ghost ${mode === "graphic" ? "font-semibold ring-2 ring-neutral-900" : ""}`} onClick={() => again("graphic")}>Logo / text (keeps text)</button>
            <button className={`btn-ghost ${mode === "photo" ? "font-semibold ring-2 ring-neutral-900" : ""}`} onClick={() => again("photo")}>Photo (AI cutout)</button>
          </div>
          <p className="text-neutral-500">{mode === "graphic" ? "Removes only the background colour, so text and logos stay. If part of the logo disappears, lower the strength." : "The AI keeps the main subject and removes everything else, including text in a logo. For logos, choose “Logo / text”."}</p>
          {mode === "graphic" && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">Strength <input type="range" min={10} max={120} value={tol} onChange={(e) => setTol(+e.target.value)} onMouseUp={() => again("graphic", tol)} onTouchEnd={() => again("graphic", tol)} onKeyUp={() => again("graphic", tol)} /></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={holes} onChange={(e) => again("graphic", tol, e.target.checked)} /> Also clear inside letters (O, A, R…)</label>
            </div>
          )}
        </div>
      )}
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
