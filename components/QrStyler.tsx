"use client";
import { useEffect, useMemo, useState } from "react";
import { PRESETS, qrSvg, scanWarnings, svgDataUrl, type BodyShape, type EyeInner, type EyeOuter, type Frame, type Gradient, type QrStyle } from "@/lib/qrStyle";
import { scansBack } from "@/lib/qrCheck";

export interface LogoOption { key: string; label: string; src: string }
const BODY: [BodyShape, string][] = [["square", "Square"], ["rounded", "Rounded"], ["dots", "Dots"], ["diamond", "Diamond"], ["vbars", "Vertical bars"], ["hbars", "Horizontal bars"], ["leaf", "Leaf"]];
const EYE_O: [EyeOuter, string][] = [["square", "Square"], ["rounded", "Rounded"], ["circle", "Circle"], ["leaf", "Leaf"]];
const EYE_I: [EyeInner, string][] = [["square", "Square"], ["rounded", "Rounded"], ["circle", "Dot"], ["diamond", "Diamond"], ["leaf", "Leaf"]];

/** Controls and live preview for a styled QR code. The parent owns the style so it can also download the result. */
export default function QrStyler({ text, style, onChange, logos = [], ecc = "H" }: { text: string; style: QrStyle; onChange: (s: QrStyle) => void; logos?: LogoOption[]; ecc?: "L" | "M" | "Q" | "H" }) {
  const [logoKey, setLogoKey] = useState("none");
  const [check, setCheck] = useState<"wait" | "ok" | "bad">("wait");
  const logoSrc = logos.find((l) => l.key === logoKey)?.src ?? "";
  useEffect(() => { if (style.logo !== logoSrc) onChange({ ...style, logo: logoSrc }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [logoSrc]);   // follow the chosen logo
  const set = (p: Partial<QrStyle>) => onChange({ ...style, ...p });
  const qr = useMemo(() => qrSvg(text, style, ecc), [text, style, ecc]);
  useEffect(() => { setCheck("wait"); let live = true; const t = setTimeout(async () => { const ok = await scansBack(qr, text); if (live) setCheck(ok ? "ok" : "bad"); }, 450); return () => { live = false; clearTimeout(t); }; }, [qr, text]);
  const warns = scanWarnings(style);

  const sel = <T extends string>(label: string, v: T, opts: [T, string][], on: (v: T) => void) => (
    <label className="flex flex-col gap-1 text-sm">{label}<select aria-label={label} className="rounded-lg border px-2 py-2.5" value={v} onChange={(e) => on(e.target.value as T)}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
  );
  const color = (label: string, v: string, on: (v: string) => void) => (
    <label className="flex flex-col gap-1 text-sm">{label}<input aria-label={label} type="color" className="h-11 w-full cursor-pointer rounded-lg border bg-white p-1" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"} onChange={(e) => on(e.target.value)} /></label>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
      {/* The preview comes first and stays in view while you scroll the controls on a phone, so every change is visible. */}
      <div className="sticky top-[60px] z-20 -mx-4 border-b bg-white px-4 py-2 sm:-mx-5 sm:px-5 md:static md:order-last md:mx-0 md:self-start md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none" data-testid="qr-preview-wrap">
        <div className="flex items-center gap-3 md:block md:space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgDataUrl(qr.svg)} alt="Your QR code" data-testid="qr-preview" className="w-28 shrink-0 rounded-xl border bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-[length:16px_16px] md:mx-auto md:w-full md:max-w-[260px] md:rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className={`rounded-lg px-3 py-2 text-sm ${check === "ok" ? "bg-green-50 text-green-800" : check === "bad" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-600"}`} data-testid="qr-check" data-state={check}>
              {check === "ok" ? "✓ Scan check passed" : check === "bad" ? "This design did not scan. Try a simpler shape, darker colours or a smaller picture." : "Checking that it scans…"}
            </p>
            <p className="hidden text-xs text-neutral-500 md:block">Always test with your own phone before you print.</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        {warns.map((w, i) => <p key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</p>)}
        <div><p className="mb-2 text-sm font-medium">Quick styles</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">{PRESETS.map((p) => <button key={p.name} className="chip shrink-0" onClick={() => set({ ...p.style })}>{p.name}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sel("Dot shape", style.body, BODY, (body) => set({ body }))}
          {sel("Corner frame", style.eyeOuter, EYE_O, (eyeOuter) => set({ eyeOuter }))}
          {sel("Corner centre", style.eyeInner, EYE_I, (eyeInner) => set({ eyeInner }))}
          {sel("Frame", style.frame, [["none", "No frame"], ["label", "Label under"], ["box", "Box with label"]] as [Frame, string][], (frame) => set({ frame }))}
          {color("Dot colour", style.color, (color) => set({ color }))}
          {color("Background", style.bg === "transparent" ? "#ffffff" : style.bg, (bg) => set({ bg }))}
          {sel("Gradient", style.gradient, [["none", "None"], ["linear", "Top to bottom"], ["diagonal", "Diagonal"], ["radial", "Centre out"]] as [Gradient, string][], (gradient) => set({ gradient }))}
          {style.gradient !== "none" ? color("Second colour", style.color2, (color2) => set({ color2 })) : null}
        </div>
        <div className="flex flex-col gap-0 text-sm">
          <label className="flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={style.bg === "transparent"} onChange={(e) => set({ bg: e.target.checked ? "transparent" : "#ffffff" })} /> Transparent background</label>
          <label className="flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={!!style.eyeColor} onChange={(e) => set({ eyeColor: e.target.checked ? "#111111" : "" })} /> Different colour for the corners
            {style.eyeColor && <input aria-label="Corner colour" type="color" className="ml-auto h-10 w-14 cursor-pointer rounded border bg-white p-1" value={style.eyeColor} onChange={(e) => set({ eyeColor: e.target.value })} />}</label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">Picture in the middle
            <select aria-label="Picture in the middle" className="rounded-lg border px-2 py-2.5" value={logoKey} onChange={(e) => setLogoKey(e.target.value)}><option value="none">None</option>{logos.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}</select></label>
          {logoSrc && <label className="flex flex-col gap-1 text-sm">Size: {Math.round(style.logoScale * 100)}%<input aria-label="Picture size" type="range" min={14} max={28} value={Math.round(style.logoScale * 100)} onChange={(e) => set({ logoScale: +e.target.value / 100 })} className="mt-2 h-8 w-full" /></label>}
          {style.frame !== "none" && <label className="flex flex-col gap-1 text-sm sm:col-span-2">Label text<input aria-label="Label text" className="input" maxLength={28} value={style.label} onChange={(e) => set({ label: e.target.value })} /></label>}
        </div>
      </div>
    </div>
  );
}
