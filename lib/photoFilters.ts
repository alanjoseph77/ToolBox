export interface Adjust { brightness: number; contrast: number; saturation: number; warmth: number; gray: boolean; sepia: boolean }
export const neutral: Adjust = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, gray: false, sepia: false };

export const presets: Record<string, Adjust> = {
  Original: neutral,
  "Black & white": { ...neutral, gray: true, contrast: 10 },
  Vivid: { ...neutral, saturation: 40, contrast: 12 },
  Warm: { ...neutral, warmth: 35, saturation: 10 },
  Cool: { ...neutral, warmth: -35 },
  Fade: { ...neutral, contrast: -18, brightness: 8, saturation: -20 },
  Vintage: { ...neutral, sepia: true, contrast: 8 },
};

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Applies the adjustments to the pixels in place. Sliders run from -100 to 100. */
export function applyAdjust(px: { data: Uint8ClampedArray }, a: Adjust) {
  const d = px.data, b = a.brightness * 2.55, c = a.contrast / 100, s = 1 + a.saturation / 100, w = a.warmth * 0.6;
  const cf = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], bl = d[i + 2];
    r += b; g += b; bl += b;
    r = cf * (r - 128) + 128; g = cf * (g - 128) + 128; bl = cf * (bl - 128) + 128;
    const l = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = l + (r - l) * s; g = l + (g - l) * s; bl = l + (bl - l) * s;
    r += w; bl -= w;
    if (a.gray) { const y = 0.299 * r + 0.587 * g + 0.114 * bl; r = g = bl = y; }
    if (a.sepia) { const nr = 0.393 * r + 0.769 * g + 0.189 * bl, ng = 0.349 * r + 0.686 * g + 0.168 * bl, nb = 0.272 * r + 0.534 * g + 0.131 * bl; r = nr; g = ng; bl = nb; }
    d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(bl);
  }
}
