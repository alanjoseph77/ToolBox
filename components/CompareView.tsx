"use client";
import { useRef, useState } from "react";

/**
 * Before / after picture. The original is on the left and the result on the right, split at a line you can drag
 * (or move with the slider below, which also works with a keyboard and a screen reader).
 */
export default function CompareView({ original, result, originalStyle, busy }: { original: string; result: string; originalStyle?: React.CSSProperties; busy?: boolean }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const at = (clientX: number) => { const r = box.current?.getBoundingClientRect(); if (r) setPos(Math.min(100, Math.max(0, Math.round(((clientX - r.left) / r.width) * 100)))); };
  return (
    <div className="space-y-2">
      <div ref={box} className="relative select-none overflow-hidden rounded-xl border bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-[length:16px_16px] touch-pan-y"
        onPointerDown={(e) => { drag.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); at(e.clientX); }}
        onPointerMove={(e) => { if (drag.current) at(e.clientX); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }} data-testid="cmp-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={original} alt="Original" className="block h-auto w-full" style={originalStyle} draggable={false} data-testid="cmp-original" />
        {result && /* eslint-disable-next-line @next/next/no-img-element */ <img src={result} alt="Result" className="absolute inset-0 h-full w-full" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} draggable={false} data-testid="cmp-result" />}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.35)]" style={{ left: `${pos}%` }}><span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-2 py-1 text-xs font-bold shadow">⇄</span></div>
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">Original</span>
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">Result</span>
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/40 text-sm font-semibold">Working…</div>}
      </div>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><span className="shrink-0 text-neutral-500">Compare</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Slide to compare the original and the result" data-testid="cmp-slider" className="h-8 w-full" /></label>
    </div>
  );
}
