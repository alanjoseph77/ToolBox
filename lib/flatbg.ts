// Background removal for logos / graphics / text on a flat colour. Unlike the AI cutout (which keeps only the
// "main object" and drops things like a logo's text), this removes ONLY pixels that match the background colour.

const dist = (d: Uint8ClampedArray, i: number, r: number, g: number, b: number) =>
  Math.sqrt((d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2);

async function load(file: Blob): Promise<ImageData> {
  const bmp = await createImageBitmap(file);
  const max = 2400, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const x = c.getContext("2d", { willReadFrequently: true })!; x.drawImage(bmp, 0, 0, c.width, c.height);
  return x.getImageData(0, 0, c.width, c.height);
}

/** Colour of the border (median) and how much of the border is that colour. */
function borderInfo(img: ImageData) {
  const { width: w, height: h, data: d } = img, rs: number[] = [], gs: number[] = [], bs: number[] = [], idx: number[] = [];
  const add = (x: number, y: number) => { const i = (y * w + x) * 4; if (d[i + 3] < 8) return; rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]); idx.push(i); };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { add(0, y); add(w - 1, y); }
  const med = (a: number[]) => a.slice().sort((p, q) => p - q)[a.length >> 1] ?? 255;
  const r = med(rs), g = med(gs), b = med(bs);
  const near = idx.filter((i) => dist(d, i, r, g, b) < 28).length / Math.max(1, idx.length);
  return { r, g, b, flat: near };
}

/** True when the picture sits on an (almost) single-colour background: a logo, graphic, screenshot or scan. */
export async function looksFlat(file: Blob): Promise<boolean> {
  try { return borderInfo(await load(file)).flat > 0.93; } catch { return false; }
}

/** Make the flat background transparent. `enclosed` also clears background-coloured holes inside letters (O, A, R…). */
export async function removeFlatBg(file: Blob, tolerance = 40, enclosed = true): Promise<Blob> {
  const img = await load(file), { width: w, height: h, data: d } = img, { r, g, b } = borderInfo(img);
  const t0 = tolerance * 0.55, t1 = tolerance * 1.25;                       // fully transparent below t0, fully kept above t1
  const alpha = new Float32Array(w * h).fill(1);
  const a = (dd: number) => (dd <= t0 ? 0 : dd >= t1 ? 1 : (dd - t0) / (t1 - t0));
  if (enclosed) {
    for (let p = 0; p < w * h; p++) alpha[p] = a(dist(d, p * 4, r, g, b));
  } else {                                                                  // flood from the border only
    const seen = new Uint8Array(w * h), q: number[] = [];
    const push = (x: number, y: number) => { const p = y * w + x; if (!seen[p] && dist(d, p * 4, r, g, b) < t1) { seen[p] = 1; q.push(p); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); } for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (q.length) { const p = q.pop()!, x = p % w, y = (p / w) | 0; alpha[p] = a(dist(d, p * 4, r, g, b)); if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
  }
  for (let p = 0; p < w * h; p++) {                                         // un-mix the background colour from soft edges so there is no halo
    const al = alpha[p], i = p * 4;
    if (al > 0 && al < 1) for (let k = 0; k < 3; k++) { const bg = k === 0 ? r : k === 1 ? g : b; d[i + k] = Math.max(0, Math.min(255, bg + (d[i + k] - bg) / Math.max(al, 0.35))); }
    d[i + 3] = Math.round(d[i + 3] * al);
  }
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d")!.putImageData(img, 0, 0);
  return new Promise((res, rej) => c.toBlob((bl) => (bl ? res(bl) : rej(new Error("encode"))), "image/png"));
}
