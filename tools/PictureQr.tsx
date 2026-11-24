"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw, Sparkles } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import PasteButton from "@/components/PasteButton";
import { BASE, PIC_DEFAULTS, drawPictureQr, picAdvice, preparePicture, qrMatrix, samplePicture, type PicFrame, type PicOpts } from "@/lib/pictureQr";
import { readsAs } from "@/lib/qrCheck";
import { canvasToBlob, download } from "@/lib/files";

type Pic = { src: CanvasImageSource; w: number; h: number; name: string };
const isPhone = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/** Picture QR: your photo fills the code and the QR is drawn as dots on top, checked live to make sure it still scans. */
export default function PictureQr() {
  const [text, setText] = useState("https://");
  const [pic, setPic] = useState<Pic | null>(null);
  const [o, setO] = useState<PicOpts>(PIC_DEFAULTS);
  const [check, setCheck] = useState<"wait" | "good" | "near" | "bad">("wait");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const changeRef = useRef<HTMLInputElement>(null);
  const value = text.trim() && text.trim() !== "https://" ? text.trim() : "";
  const n = useMemo(() => (value ? qrMatrix(value).size : 0), [value]);
  const set = (p: Partial<PicOpts>) => setO((x) => ({ ...x, ...p }));

  // the picture with zoom / colour settings, made once per change (not per dot)
  const prepared = useMemo(() => (pic ? preparePicture(pic.src, pic.w, pic.h, o) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pic, o.zoom, o.x, o.y, o.brightness, o.contrast, o.saturation]);

  useEffect(() => {
    if (!value || !preview.current) return;
    drawPictureQr(preview.current, value, prepared, o, 640);
    setCheck("wait");
    let live = true;
    const t = setTimeout(async () => {
      const c = preview.current; if (!c) return;
      // near: as if held close to the camera; far: as if printed small or seen from a distance
      // "far" is drawn small and slightly blurred, the way a phone camera sees a printed code
      const near = await readsAs(c, value, 640);
      let far = false;
      if (near) { const b = document.createElement("canvas"); b.width = b.height = 300; const g = b.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, 300, 300); g.filter = "blur(1px)"; g.drawImage(c, 10, 10, 280, 280); far = await readsAs(b, value, 300); }
      if (live) setCheck(far ? "good" : near ? "near" : "bad");
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [value, prepared, o]);

  const take = async (f?: File) => {
    if (!f) return;
    setMsg("");
    try { const b = await createImageBitmap(f); setPic({ src: b, w: b.width, h: b.height, name: f.name }); set({ zoom: 1, x: 0, y: 0 }); }
    catch { setMsg("Could not open that picture. Try a JPG or PNG."); }
  };
  const sample = () => { const c = samplePicture(); setPic({ src: c, w: c.width, h: c.height, name: "Sample sunset" }); if (!value) setText("https://toolbox.otaga.in"); };

  const save = async (scale: number) => {
    if (!value) return;
    setBusy(true); setMsg("");
    try {
      const c = document.createElement("canvas");
      drawPictureQr(c, value, prepared, o, BASE * scale);
      download(await canvasToBlob(c, "image/png"), `picture-qr-${BASE * scale}px.png`, "image/png", false);
    } catch { setMsg("That size is too big for this device. Try a smaller one."); }
    setBusy(false);
  };

  const slider = (label: string, k: keyof PicOpts, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="block text-sm">
      <span className="flex items-center justify-between"><span>{label}</span>
        <span className="flex items-center gap-1 text-neutral-500">{fmt(o[k] as number)}
          {(o[k] as number) !== (PIC_DEFAULTS[k] as number) && <button type="button" onClick={() => set({ [k]: PIC_DEFAULTS[k] } as Partial<PicOpts>)} aria-label={`Reset ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"><RotateCcw className="h-3.5 w-3.5" /></button>}</span></span>
      <input type="range" min={min} max={max} step={step} value={o[k] as number} onChange={(e) => set({ [k]: +e.target.value } as Partial<PicOpts>)} className="mt-1 h-8 w-full" aria-label={label} data-testid={`pq-${k}`} />
    </label>
  );
  const pct = (v: number) => `${Math.round(v * 100)}%`, x2 = (v: number) => `${v.toFixed(2)}×`;
  const sizes = isPhone() ? [1, 2, 4] : [1, 2, 4, 8];

  return (
    <div className="space-y-5">
      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-bold">1. Your link</h2>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="https://yourshop.in or any text" data-testid="pq-text" aria-label="Link or text" />
        {value && <p className="text-xs text-neutral-500" data-testid="pq-size">{n} × {n} squares. {n >= 45 ? "A shorter link makes the picture clearer." : "Good: short links show more of the picture."}</p>}
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-bold">2. Your picture</h2>
        {!pic ? (
          <>
            <Dropzone accept="image/*" onFiles={(f) => take(f[0])} hint="A photo, artwork or logo. It stays on your device." />
            <button className="btn-ghost w-full" onClick={sample} data-testid="pq-sample"><Sparkles className="h-4 w-4" /> No picture? Try a sample</button>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium" data-testid="pq-picname">{pic.name}</span>
            <button className="btn-ghost !py-1.5" onClick={() => changeRef.current?.click()}><ImagePlus className="h-4 w-4" /> Change picture</button>
            <PasteButton small label="Paste" onFiles={(f) => take(f[0])} />
            <button className="btn-ghost !py-1.5" onClick={() => setPic(null)}>Remove</button>
            <input ref={changeRef} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        )}
        {msg && <p className="text-sm text-red-600" role="alert">{msg}</p>}
      </section>

      {value && (
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold">3. Adjust and download</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* preview first; on phones it stays in view while you move the sliders */}
            <div className="sticky top-[60px] z-20 -mx-4 border-b bg-white px-4 py-2 sm:-mx-5 sm:px-5 md:static md:order-last md:mx-0 md:self-start md:border-0 md:bg-transparent md:p-0 dark:bg-black md:dark:bg-transparent">
              <div className="flex items-center gap-3 md:block md:space-y-3">
                <canvas ref={preview} data-testid="pq-preview" aria-label="Picture QR preview" className="w-32 shrink-0 rounded-xl bg-[repeating-conic-gradient(#e5e5e5_0_25%,#fff_0_50%)] bg-[length:16px_16px] md:w-full" />
                <p className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm ${check === "good" ? "bg-green-50 text-green-800" : check === "near" ? "bg-amber-50 text-amber-900" : check === "bad" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-600"}`} data-testid="pq-check" data-state={check}>
                  {check === "good" ? "✓ Scan check passed, also from far away" : check === "near" ? "Scans up close, but not from far away. Make the dots bigger or add contrast before printing it small." : check === "bad" ? "This does not scan. Make the dots bigger, add contrast or use a shorter link." : "Checking that it scans…"}
                </p>
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              {picAdvice(n, o).map((a) => <p key={a} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{a}</p>)}
              <div>
                <p className="mb-2 text-sm font-medium">Style</p>
                <div className="flex gap-2" role="radiogroup" aria-label="Style">
                  {([["plain", "Plain"], ["card", "Card"], ["stamp", "Stamp"]] as [PicFrame, string][]).map(([k, l]) => (
                    <button key={k} role="radio" aria-checked={o.frame === k} onClick={() => set({ frame: k })} data-testid={`pq-frame-${k}`} className={`chip ${o.frame === k ? "chip-active" : ""}`}>{l}</button>))}
                </div>
              </div>
              {slider("Dot size", "dot", 0.3, 0.7, 0.01, pct)}
              {pic && <>
                {slider("Zoom", "zoom", 1, 3, 0.05, x2)}
                {slider("Position left / right", "x", -1, 1, 0.02, (v) => `${Math.round(v * 100)}%`)}
                {slider("Position up / down", "y", -1, 1, 0.02, (v) => `${Math.round(v * 100)}%`)}
                {slider("Brightness", "brightness", 0.5, 1.6, 0.01, x2)}
                {slider("Contrast", "contrast", 0.6, 2, 0.01, x2)}
                {slider("Colour", "saturation", 0, 2, 0.01, x2)}
                {slider("Picture strength", "strength", 0.3, 1, 0.01, pct)}
              </>}
              {!pic && <p className="text-sm text-neutral-500">Add a picture above to see it inside the code.</p>}
              <div className="space-y-2 border-t pt-4 dark:border-neutral-800">
                <p className="text-sm font-medium">Download PNG</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => <button key={s} className={s === 2 ? "btn" : "btn-ghost"} disabled={busy} onClick={() => save(s)} data-testid={`pq-dl-${s}`}><Download className="h-4 w-4" /> {s}× · {BASE * s} px</button>)}
                </div>
                <p className="text-xs text-neutral-500">2× is good for phones and social media, 4× for print{sizes.includes(8) ? ", 8× for posters" : ""}. Always test it with your own phone before printing.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
