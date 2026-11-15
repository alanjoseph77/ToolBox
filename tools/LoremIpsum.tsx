"use client";
import { useMemo, useState } from "react";

const W = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

function make(kind: "paragraphs" | "sentences" | "words", n: number, classic: boolean): string {
  seed = 7;
  const words = (c: number, first: boolean) => { const o: string[] = []; for (let i = 0; i < c; i++) o.push(first && i < 5 ? W[i] : W[Math.floor(rnd() * W.length)]); return o; };
  const sentence = (first: boolean) => { const w = words(8 + Math.floor(rnd() * 9), first); w[0] = w[0][0].toUpperCase() + w.slice(0)[0].slice(1); return w.join(" ") + "."; };
  if (kind === "words") return words(n, classic).join(" ");
  if (kind === "sentences") return Array.from({ length: n }, (_, i) => sentence(classic && i === 0)).join(" ");
  return Array.from({ length: n }, (_, p) => Array.from({ length: 4 + Math.floor(rnd() * 3) }, (_, i) => sentence(classic && p === 0 && i === 0)).join(" ")).join("\n\n");
}

export default function LoremIpsum() {
  const [kind, setKind] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [n, setN] = useState(3);
  const [classic, setClassic] = useState(true);
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => make(kind, Math.min(Math.max(1, n), 500), classic), [kind, n, classic]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 text-sm">
        <input aria-label="How many" type="number" min={1} max={500} className="input w-24" value={n} onChange={(e) => setN(+e.target.value)} />
        <select aria-label="Unit" className="rounded-lg border px-2 py-2" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="paragraphs">paragraphs</option><option value="sentences">sentences</option><option value="words">words</option></select>
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} /> Start with &quot;Lorem ipsum dolor sit amet&quot;</label>
      </div>
      <textarea readOnly aria-label="Generated text" data-testid="lorem" className="input h-64 text-sm" value={text} />
      <button className="btn w-full" onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? "Copied!" : "Copy text"}</button>
    </div>
  );
}
