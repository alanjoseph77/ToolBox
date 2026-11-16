// Automatic photo enhancement on raw pixels: noise, levels, colour cast, exposure, shadows, highlights, contrast, vibrance, sharpness.
// Works on a plain { data, width, height } object (the same shape as a canvas ImageData), so it can be tested without a browser.
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
export interface EnhanceOpts {
  strength: number;       // 0-100: how much of the result to blend in over the original
  auto: number;           // 0-100: automatic levels and exposure
  whiteBalance: boolean;  // remove a colour cast
  contrast: number;       // 0-60
  shadows: number;        // 0-100: brighten dark areas
  highlights: number;     // 0-100: calm very bright areas
  vibrance: number;       // 0-100: boost dull colours more than strong ones
  sharpen: number;        // 0-100
  denoise: number;        // 0-100
}
export const NEUTRAL: EnhanceOpts = { strength: 100, auto: 0, whiteBalance: false, contrast: 0, shadows: 0, highlights: 0, vibrance: 0, sharpen: 0, denoise: 0 };
export const PRESETS: Record<string, EnhanceOpts> = {
  Auto: { strength: 100, auto: 100, whiteBalance: false, contrast: 12, shadows: 25, highlights: 15, vibrance: 30, sharpen: 35, denoise: 15 },
  "Low light": { strength: 100, auto: 100, whiteBalance: true, contrast: 8, shadows: 70, highlights: 10, vibrance: 25, sharpen: 25, denoise: 45 },
  Vivid: { strength: 100, auto: 80, whiteBalance: false, contrast: 22, shadows: 15, highlights: 20, vibrance: 70, sharpen: 40, denoise: 10 },
  Portrait: { strength: 100, auto: 70, whiteBalance: false, contrast: 6, shadows: 30, highlights: 20, vibrance: 12, sharpen: 15, denoise: 40 },
  Document: { strength: 100, auto: 100, whiteBalance: true, contrast: 35, shadows: 20, highlights: 0, vibrance: 0, sharpen: 70, denoise: 10 },
};

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Light edge-preserving smoothing: each pixel is averaged only with neighbours that look similar to it. */
function denoise(d: Uint8ClampedArray, w: number, h: number, amount: number) {
  const src = new Uint8ClampedArray(d), T = 8 + amount * 0.45, mix = Math.min(1, amount / 55);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4, l0 = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
    let sr = 0, sg = 0, sb = 0, sw = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = ((y + dy) * w + x + dx) * 4, diff = Math.abs(src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114 - l0);
      const k = diff >= T ? 0 : 1 - diff / T; if (!k) continue; sr += src[j] * k; sg += src[j + 1] * k; sb += src[j + 2] * k; sw += k;
    }
    d[i] = src[i] + (sr / sw - src[i]) * mix; d[i + 1] = src[i + 1] + (sg / sw - src[i + 1]) * mix; d[i + 2] = src[i + 2] + (sb / sw - src[i + 2]) * mix;
  }
}

/**
 * Automatic levels. Stretches the tones to use the full range and picks a good exposure.
 * The black point comes from the darkest colour channel and the white point from the brightest one, so a strongly coloured
 * picture (a blue night, an orange sunset) is never pushed past black or white. With the colour-cast fix on, each channel is also stretched on its own, within limits.
 */
function levels(d: Uint8ClampedArray, n: number, o: EnhanceOpts) {
  const hist = new Uint32Array(256), vh = new Uint32Array(256), mh = new Uint32Array(256), ch = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; let total = 0;
  for (let i = 0; i < n * 4; i += 4) {
    if (d[i + 3] < 8) continue; const r = d[i], g = d[i + 1], b = d[i + 2];
    hist[(r * 0.299 + g * 0.587 + b * 0.114) | 0]++; vh[r > g ? (r > b ? r : b) : g > b ? g : b]++; mh[r < g ? (r < b ? r : b) : g < b ? g : b]++; ch[0][r]++; ch[1][g]++; ch[2][b]++; total++;
  }
  if (!total) return;
  const cut = total * 0.004;
  const range = (h: Uint32Array): [number, number] => {
    let acc = 0, lo = 0, hi = 255;
    for (let v = 0; v < 256; v++) { acc += h[v]; if (acc > cut) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += h[v]; if (acc > cut) { hi = v; break; } }
    if (hi - lo < 24) { lo = Math.max(0, lo - 12); hi = Math.min(255, hi + 12); }
    return [lo, hi];
  };
  const lo0 = Math.min(range(hist)[0], range(mh)[0]), hi0 = Math.max(range(hist)[1], range(vh)[1]), a = o.auto / 100, span = hi0 - lo0;
  let mean = 0; for (let v = 0; v < 256; v++) mean += (hist[v] / total) * Math.min(1, Math.max(0, (v - lo0) / span));
  const gamma = Math.min(1.35, Math.max(0.55, Math.log(0.47) / Math.log(Math.min(0.9, Math.max(0.08, mean)))));
  const luts = [0, 1, 2].map((c) => {
    let [lo, hi] = o.whiteBalance ? range(ch[c]) : [lo0, hi0];
    if (o.whiteBalance) { lo = Math.min(Math.max(lo, lo0 - span * 0.35), lo0 + span * 0.35); hi = Math.min(Math.max(hi, hi0 - span * 0.35), hi0 + span * 0.35); if (hi - lo < 24) hi = lo + 24; }
    const lut = new Float32Array(256);
    for (let v = 0; v < 256; v++) { const full = 255 * Math.pow(Math.min(1, Math.max(0, (v - lo) / (hi - lo))), gamma); lut[v] = v + (full - v) * a; }
    return lut;
  });
  for (let i = 0; i < n * 4; i += 4) { d[i] = luts[0][d[i]]; d[i + 1] = luts[1][d[i + 1]]; d[i + 2] = luts[2][d[i + 2]]; }
}

/** Shadows, highlights, contrast and vibrance in one pass. Contrast is an S-curve, so tones flatten gently at the ends instead of clipping. */
function tone(d: Uint8ClampedArray, n: number, o: EnhanceOpts) {
  const S = o.shadows / 100, H = o.highlights / 100, K = o.contrast / 40, V = o.vibrance / 100;
  if (!S && !H && !K && !V) return;
  for (let i = 0; i < n * 4; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const L = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    if (S) { let k = 1 + S * 0.9 * (1 - L) * (1 - L); const m = Math.max(r, g, b); if (m * k > 255) k = 255 / Math.max(1, m); r *= k; g *= k; b *= k; }   // never lift a colour past white
    if (H) { const k = 1 - H * 0.22 * L * L * L; r *= k; g *= k; b *= k; }
    if (K) {
      const c = (v: number) => { const x = Math.min(1, Math.max(0, v / 255)), sm = x * x * (3 - 2 * x); return 255 * (x + (sm - x) * K); };
      r = c(r); g = c(g); b = c(b);
    }
    if (V) {
      const mx0 = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx0 - mn) / 255, k = 1 + V * 0.9 * (1 - sat), l = r * 0.299 + g * 0.587 + b * 0.114;
      let nr = l + (r - l) * k, ng = l + (g - l) * k, nb = l + (b - l) * k;
      const mx = Math.max(nr, ng, nb); if (mx > 255 && mx > l) { const f = (255 - l) / (mx - l); nr = l + (nr - l) * f; ng = l + (ng - l) * f; nb = l + (nb - l) * f; }   // back off instead of clipping
      r = nr; g = ng; b = nb;
    }
    d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(b);
  }
}

/** Box blur (running sums, two passes) of the colour channels. */
function blur(src: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(src.length), out = new Uint8ClampedArray(src.length), win = 2 * r + 1;
  for (let y = 0; y < h; y++) for (let c = 0; c < 3; c++) {
    let acc = 0; const row = y * w * 4 + c;
    for (let k = -r; k <= r; k++) acc += src[row + Math.min(w - 1, Math.max(0, k)) * 4];
    for (let x = 0; x < w; x++) { tmp[row + x * 4] = acc / win; acc += src[row + Math.min(w - 1, x + r + 1) * 4] - src[row + Math.max(0, x - r) * 4]; }
  }
  for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let acc = 0; const col = x * 4 + c;
    for (let k = -r; k <= r; k++) acc += tmp[Math.min(h - 1, Math.max(0, k)) * w * 4 + col];
    for (let y = 0; y < h; y++) { out[y * w * 4 + col] = acc / win; acc += tmp[Math.min(h - 1, y + r + 1) * w * 4 + col] - tmp[Math.max(0, y - r) * w * 4 + col]; }
  }
  return out;
}

/** Unsharp mask: adds back the difference between the picture and a blurred copy, ignoring tiny differences (noise). */
function sharpen(d: Uint8ClampedArray, w: number, h: number, amount: number) {
  const r = Math.max(2, Math.round(Math.max(w, h) / 900)), bl = blur(d, w, h, r), K = (amount / 100) * 1.4;
  for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) { const diff = d[i + c] - bl[i + c]; if (Math.abs(diff) > 1) d[i + c] = clamp(d[i + c] + K * diff); }
}

/** Enhances the picture in place. Transparent pixels keep their transparency. */
export function enhance(px: Pixels, o: EnhanceOpts): void {
  const { data: d, width: w, height: h } = px, n = w * h;
  if (o.strength <= 0) return;
  const orig = o.strength < 100 ? new Uint8ClampedArray(d) : null;
  if (o.denoise > 0) denoise(d, w, h, o.denoise);
  if (o.auto > 0 || o.whiteBalance) levels(d, n, o);
  tone(d, n, o);
  if (o.sharpen > 0) sharpen(d, w, h, o.sharpen);
  if (orig) { const k = o.strength / 100; for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = orig[i + c] + (d[i + c] - orig[i + c]) * k; }
}
