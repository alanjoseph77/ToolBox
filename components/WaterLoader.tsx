"use client";
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 1100; // quick jobs still show a full, satisfying fill
const HINTS = ["Everything stays on your device", "Getting things ready…", "Almost there…"];

interface Props {
  active: boolean;
  /** 0..1 when the tool knows its real progress; otherwise the fill eases toward ~92%. */
  progress?: number;
  label?: string;
  hints?: string[];
}

export default function WaterLoader({ active, progress, label = "Working on it…", hints = HINTS }: Props) {
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const [hint, setHint] = useState(0);
  const startedAt = useRef(0);

  // Show immediately; when the job ends, fill to 100% and stay for a moment before hiding.
  useEffect(() => {
    if (active) { startedAt.current = Date.now(); setVisible(true); setPct(0); return; }
    if (!visible) return;
    setPct(100);
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt.current)) + 500;
    const t = setTimeout(() => setVisible(false), wait);
    return () => clearTimeout(t);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setPct((p) => (progress !== undefined ? progress * 100 : p + (92 - p) * 0.07)), 120);
    return () => clearInterval(id);
  }, [active, progress]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setHint((h) => (h + 1) % hints.length), 2600);
    return () => clearInterval(id);
  }, [visible, hints.length]);

  if (!visible) return null;
  const shown = Math.round(Math.min(100, Math.max(pct, 4)));
  const done = !active && shown >= 100;

  return (
    <div role="status" aria-live="polite" className="flex animate-pop flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-neutral-900 dark:border-white">
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-out" style={{ height: `${shown}%` }}>
          {[["animate-wave", "opacity-40"], ["animate-wave-slow", "opacity-100"]].map(([anim, op]) => (
            <svg key={anim} viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden className={`absolute -top-[13px] left-0 h-4 w-[200%] fill-neutral-900 dark:fill-white ${anim} ${op}`}>
              <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V20 H0 Z" />
            </svg>
          ))}
          <div className="absolute inset-x-0 bottom-0 top-[3px] bg-neutral-900 dark:bg-white" />
          {[["20%", "0s", 6], ["48%", "0.9s", 4], ["72%", "1.7s", 5]].map(([left, delay, size]) => (
            <span key={String(left)} aria-hidden className="absolute bottom-1 animate-bubble rounded-full border border-white/70 dark:border-black/50"
              style={{ left: left as string, animationDelay: delay as string, width: size as number, height: size as number }} />
          ))}
        </div>
        {/* blend mode keeps the number readable on both the empty and the filled part */}
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-white mix-blend-difference">
          {done ? "✓" : `${shown}%`}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold">{done ? "Done!" : label}</p>
        {!done && <p className="mt-0.5 text-xs text-neutral-500">{hints[hint % hints.length]}</p>}
      </div>
    </div>
  );
}
