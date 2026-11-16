// Invert (negative) a picture on raw pixels. Works on a plain { data, width, height } object so it can be tested without a browser.
import type { Pixels } from "./enhance";

export type InvertMode = "negative" | "smart" | "bw";
export interface InvertOpts { mode: InvertMode; r: boolean; g: boolean; b: boolean; strength: number }   // strength 0-100
export const DEFAULT_INVERT: InvertOpts = { mode: "negative", r: true, g: true, b: true, strength: 100 };

/** Inverts only the lightness and keeps each colour's hue: a "dark mode" look for screenshots, documents and drawings. */
function smart(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
  if (!dl) { const v = (1 - l) * 255; return [v, v, v]; }
  const s = l > 0.5 ? dl / (2 - mx - mn) : dl / (mx + mn);
  const h = mx === r ? ((g - b) / dl + (g < b ? 6 : 0)) : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4;   // 0..6
  const L = 1 - l, q = L < 0.5 ? L * (1 + s) : L + s - L * s, p = 2 * L - q;
  const f = (t: number) => { t = (t + 6) % 6; return (t < 1 ? p + (q - p) * t : t < 3 ? q : t < 4 ? p + (q - p) * (4 - t) : p) * 255; };
  return [f(h + 2), f(h), f(h - 2)];
}

export function invert(px: Pixels, o: InvertOpts): void {
  const d = px.data, k = Math.min(1, Math.max(0, o.strength / 100));
  if (k === 0) return;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;                      // fully transparent: nothing to invert
    const r = d[i], g = d[i + 1], b = d[i + 2]; let nr: number, ng: number, nb: number;
    if (o.mode === "smart") [nr, ng, nb] = smart(r, g, b);
    else if (o.mode === "bw") { const y = 255 - (r * 0.299 + g * 0.587 + b * 0.114); nr = ng = nb = y; }
    else { nr = o.r ? 255 - r : r; ng = o.g ? 255 - g : g; nb = o.b ? 255 - b : b; }
    d[i] = r + (nr - r) * k; d[i + 1] = g + (ng - g) * k; d[i + 2] = b + (nb - b) * k;
  }
}
