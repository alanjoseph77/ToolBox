// Styled QR codes: the data comes from the `qrcode` library, the drawing (shapes, eyes, colours, logo, frame) is done here as SVG.
import QRCode from "qrcode";

export type BodyShape = "square" | "rounded" | "dots" | "diamond" | "vbars" | "hbars" | "leaf" | "fluid" | "classy" | "small" | "tiny" | "star" | "heart" | "plus" | "hexagon";
export type EyeOuter = "square" | "rounded" | "circle" | "leaf" | "octagon" | "drop";
export type EyeInner = "square" | "rounded" | "circle" | "diamond" | "leaf" | "octagon" | "star" | "drop";
export type Frame = "none" | "label" | "box" | "top" | "bubble" | "badge";
export type Gradient = "none" | "linear" | "diagonal" | "radial";

export interface QrStyle {
  body: BodyShape; eyeOuter: EyeOuter; eyeInner: EyeInner;
  color: string; color2: string; gradient: Gradient;   // colour 2 is used when gradient is not "none"
  eyeColor: string;                                     // "" = same as the dots
  bg: string;                                           // hex, or "transparent"
  logo: string;                                         // data URL, "" for none
  logoScale: number;                                    // share of the QR width, 0.14 to 0.28
  frame: Frame; label: string;
}

export const DEFAULT_STYLE: QrStyle = { body: "square", eyeOuter: "square", eyeInner: "square", color: "#111111", color2: "#111111", gradient: "none", eyeColor: "", bg: "#ffffff", logo: "", logoScale: 0.22, frame: "none", label: "Scan to order" };

export const PRESETS: { name: string; style: Partial<QrStyle> }[] = [
  { name: "Classic", style: { body: "square", eyeOuter: "square", eyeInner: "square", color: "#111111", gradient: "none", eyeColor: "", bg: "#ffffff" } },
  { name: "Soft", style: { body: "rounded", eyeOuter: "rounded", eyeInner: "rounded", color: "#1f2937", gradient: "none", eyeColor: "", bg: "#ffffff" } },
  { name: "Liquid", style: { body: "fluid", eyeOuter: "rounded", eyeInner: "rounded", color: "#1d4ed8", color2: "#7c3aed", gradient: "diagonal", eyeColor: "", bg: "#ffffff" } },
  { name: "Classy", style: { body: "classy", eyeOuter: "leaf", eyeInner: "leaf", color: "#111827", gradient: "none", eyeColor: "#b45309", bg: "#fffbeb" } },
  { name: "Dots", style: { body: "dots", eyeOuter: "circle", eyeInner: "circle", color: "#0f766e", color2: "#2563eb", gradient: "diagonal", eyeColor: "#0f172a", bg: "#ffffff" } },
  { name: "Tiny dots", style: { body: "tiny", eyeOuter: "rounded", eyeInner: "circle", color: "#0f172a", gradient: "none", eyeColor: "#e11d48", bg: "#ffffff" } },
  { name: "Pixels", style: { body: "small", eyeOuter: "square", eyeInner: "square", color: "#4338ca", gradient: "none", eyeColor: "", bg: "#eef2ff" } },
  { name: "Leaf", style: { body: "leaf", eyeOuter: "leaf", eyeInner: "leaf", color: "#15803d", gradient: "none", eyeColor: "#14532d", bg: "#f0fdf4" } },
  { name: "Diamond", style: { body: "diamond", eyeOuter: "square", eyeInner: "diamond", color: "#7c3aed", color2: "#db2777", gradient: "linear", eyeColor: "#4c1d95", bg: "#ffffff" } },
  { name: "Bars", style: { body: "vbars", eyeOuter: "rounded", eyeInner: "rounded", color: "#b45309", gradient: "none", eyeColor: "#7c2d12", bg: "#fffbeb" } },
  { name: "Stripes", style: { body: "hbars", eyeOuter: "octagon", eyeInner: "octagon", color: "#0e7490", gradient: "none", eyeColor: "#164e63", bg: "#ecfeff" } },
  { name: "Stars", style: { body: "star", eyeOuter: "rounded", eyeInner: "star", color: "#a16207", color2: "#dc2626", gradient: "radial", eyeColor: "#7c2d12", bg: "#fefce8" } },
  { name: "Love", style: { body: "heart", eyeOuter: "drop", eyeInner: "circle", color: "#e11d48", color2: "#9d174d", gradient: "radial", eyeColor: "#9f1239", bg: "#fff1f2" } },
  { name: "Plus", style: { body: "plus", eyeOuter: "square", eyeInner: "square", color: "#dc2626", gradient: "none", eyeColor: "#111111", bg: "#ffffff" } },
  { name: "Honeycomb", style: { body: "hexagon", eyeOuter: "octagon", eyeInner: "octagon", color: "#ca8a04", color2: "#92400e", gradient: "linear", eyeColor: "#78350f", bg: "#fffbeb" } },
  { name: "Ocean", style: { body: "dots", eyeOuter: "rounded", eyeInner: "circle", color: "#0c4a6e", color2: "#0891b2", gradient: "linear", eyeColor: "#082f49", bg: "#ecfeff" } },
  { name: "Night", style: { body: "fluid", eyeOuter: "drop", eyeInner: "drop", color: "#f8fafc", gradient: "none", eyeColor: "#facc15", bg: "#0f172a" } },
  { name: "Mint", style: { body: "rounded", eyeOuter: "circle", eyeInner: "rounded", color: "#047857", color2: "#0d9488", gradient: "diagonal", eyeColor: "", bg: "#ecfdf5" } },
];

const C = 10;                                           // one QR square is 10 units wide in the drawing
const f = (n: number) => +n.toFixed(2);

/** Closed path for one shape inside the square (x, y, size w). r is the corner radius for rounded and leaf shapes. */
function shape(kind: string, x: number, y: number, w: number, r: number): string {
  const cx = x + w / 2, cy = y + w / 2;
  const poly = (pts: [number, number][]) => `M${pts.map(([a, b]) => `${f(a)} ${f(b)}`).join("L")}Z`;
  if (kind === "octagon") { const k = w * 0.29; return poly([[x + k, y], [x + w - k, y], [x + w, y + k], [x + w, y + w - k], [x + w - k, y + w], [x + k, y + w], [x, y + w - k], [x, y + k]]); }
  if (kind === "hexagon") { const pts: [number, number][] = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; pts.push([cx + (w / 2) * Math.cos(a), cy + (w / 2) * Math.sin(a)]); } return poly(pts); }
  if (kind === "star") { const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? w * 0.26 : w * 0.53; pts.push([cx + rr * Math.cos(a), cy + 0.06 * w + rr * Math.sin(a)]); } return poly(pts); }
  if (kind === "plus") { const t = w / 3; return poly([[x + t, y], [x + 2 * t, y], [x + 2 * t, y + t], [x + w, y + t], [x + w, y + 2 * t], [x + 2 * t, y + 2 * t], [x + 2 * t, y + w], [x + t, y + w], [x + t, y + 2 * t], [x, y + 2 * t], [x, y + t], [x + t, y + t]]); }
  if (kind === "heart") return `M${f(cx)} ${f(y + w * 0.95)}C${f(x - w * 0.15)} ${f(y + w * 0.45)} ${f(x + w * 0.12)} ${f(y - w * 0.12)} ${f(cx)} ${f(y + w * 0.26)}C${f(x + w * 0.88)} ${f(y - w * 0.12)} ${f(x + w * 1.15)} ${f(y + w * 0.45)} ${f(cx)} ${f(y + w * 0.95)}Z`;
  if (kind === "drop") { const q = w / 2; return `M${f(x)} ${f(y)}H${f(x + q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + w)} ${f(y + q)}V${f(y + w - q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + w - q)} ${f(y + w)}H${f(x + q)}A${f(q)} ${f(q)} 0 0 1 ${f(x)} ${f(y + w - q)}Z`; }
  if (kind === "circle") { const h = w / 2; return `M${f(x)} ${f(y + h)}a${f(h)} ${f(h)} 0 1 0 ${f(w)} 0a${f(h)} ${f(h)} 0 1 0 ${f(-w)} 0Z`; }
  if (kind === "diamond") { const h = w / 2; return `M${f(x + h)} ${f(y)}L${f(x + w)} ${f(y + h)}L${f(x + h)} ${f(y + w)}L${f(x)} ${f(y + h)}Z`; }
  if (kind === "leaf") return `M${f(x + r)} ${f(y)}H${f(x + w)}V${f(y + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + w)}H${f(x)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
  if (kind === "rounded") return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + w)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + w - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
  return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + w)}H${f(x)}Z`;
}
/** Rectangle with its own radius for each corner: top-left, top-right, bottom-right, bottom-left. */
function rr(x: number, y: number, w: number, h: number, [a, b, c, d]: number[]): string {
  return `M${f(x + a)} ${f(y)}H${f(x + w - b)}${b ? `A${f(b)} ${f(b)} 0 0 1 ${f(x + w)} ${f(y + b)}` : ""}V${f(y + h - c)}${c ? `A${f(c)} ${f(c)} 0 0 1 ${f(x + w - c)} ${f(y + h)}` : ""}H${f(x + d)}${d ? `A${f(d)} ${f(d)} 0 0 1 ${f(x)} ${f(y + h - d)}` : ""}V${f(y + a)}${a ? `A${f(a)} ${f(a)} 0 0 1 ${f(x + a)} ${f(y)}` : ""}Z`;
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const hex = (c: string, fb: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : fb);

export function luminance(h: string): number {
  const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
/** Plain-language warnings when a colour choice may stop phones from reading the code. */
export function scanWarnings(s: QrStyle): string[] {
  const out: string[] = [], bg = s.bg === "transparent" ? "#ffffff" : hex(s.bg, "#ffffff");
  const cols = [hex(s.color, "#111111"), ...(s.gradient !== "none" ? [hex(s.color2, "#111111")] : []), ...(s.eyeColor ? [hex(s.eyeColor, "#111111")] : [])];
  const lb = luminance(bg);
  for (const c of cols) { const l = luminance(c), ratio = (Math.max(l, lb) + 0.05) / (Math.min(l, lb) + 0.05); if (ratio < 3) { out.push("The colours are too close to the background. Pick a darker code or a lighter background."); break; } }
  if (cols.some((c) => luminance(c) > lb)) out.push("A light code on a dark background is read by most new phones but not by every scanner. Test it before printing.");
  if (s.bg === "transparent") out.push("A transparent background is safe to scan only on a light surface.");
  if (s.logo && s.logoScale > 0.24) out.push("A big logo can make the code harder to scan. Keep it at 24% or less.");
  if (s.logo && ["star", "heart", "plus", "tiny"].includes(s.body) && s.logoScale > 0.18) out.push("Fancy dot shapes with a picture in the middle are harder to scan from far away. Use a smaller picture (18% or less).");
  return out;
}

export interface QrResult { svg: string; width: number; height: number; modules: number }

export function qrSvg(text: string, s: QrStyle, ecc: "L" | "M" | "Q" | "H" = "H"): QrResult {
  const qr = QRCode.create(text || " ", { errorCorrectionLevel: s.logo ? "H" : ecc });
  const n = qr.modules.size, dark = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && qr.modules.get(r, c) === 1;
  const M = 3, W = (n + 2 * M) * C;                       // quiet zone of 3 squares
  const label = s.frame !== "none" && s.label.trim() ? s.label.trim().slice(0, 28) : "";
  const boxed = s.frame === "box" || s.frame === "badge";
  const pad = boxed ? 2.2 * C : 0, labelH = s.frame === "none" ? 0 : s.frame === "badge" ? 8 * C : s.frame === "bubble" ? 8.5 * C : 7 * C;
  const totalW = W + 2 * pad, totalH = W + 2 * pad + labelH;
  const top = s.frame === "top" ? labelH : 0;               // "top" puts the label above the code
  const ox = pad + M * C, oy = pad + M * C + top;         // where the first square starts
  const col = hex(s.color, "#111111"), col2 = hex(s.color2, col), eye = s.eyeColor ? hex(s.eyeColor, col) : "";
  const bg = s.bg === "transparent" ? "" : hex(s.bg, "#ffffff");
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // area kept free for the logo
  let lx0 = 0, ly0 = 0, lx1 = -1, ly1 = -1, lsize = 0;
  if (s.logo) { lsize = Math.round(n * Math.min(0.3, Math.max(0.1, s.logoScale))) | 1; const a = Math.floor((n - lsize) / 2); lx0 = ly0 = a; lx1 = ly1 = a + lsize - 1; }
  const inLogo = (r: number, c: number) => !!s.logo && r >= ly0 - 1 && r <= ly1 + 1 && c >= lx0 - 1 && c <= lx1 + 1;
  const on = (r: number, c: number) => dark(r, c) && !inEye(r, c) && !inLogo(r, c);

  const fillBody = s.gradient === "none" ? col : "url(#qg)", fillEye = eye || fillBody;
  let defs = "";
  if (s.gradient === "radial") defs = `<radialGradient id="qg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col2}"/></radialGradient>`;
  else if (s.gradient !== "none") defs = `<linearGradient id="qg" gradientUnits="userSpaceOnUse" x1="${ox}" y1="${s.gradient === "diagonal" ? oy : oy}" x2="${s.gradient === "diagonal" ? ox + n * C : ox}" y2="${oy + n * C}"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col2}"/></linearGradient>`;

  // body squares
  let d = "";
  const cell = (r: number, c: number) => [ox + c * C, oy + r * C] as const;
  if (s.body === "vbars" || s.body === "hbars") {
    const v = s.body === "vbars";
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const r = v ? b : a, c = v ? a : b; if (!on(r, c)) continue;
      if (v ? on(r - 1, c) : on(r, c - 1)) continue;      // not the start of a run
      let len = 1; while (v ? on(r + len, c) : on(r, c + len)) len++;
      const [x, y] = cell(r, c), w = C * 0.84, ins = C * 0.08;
      const bw = v ? w : len * C - 2 * ins, bh = v ? len * C - 2 * ins : w, bx = x + ins, by = y + ins, rad = Math.min(bw, bh) / 2;
      d += v   // a pill shape: round caps at the two short ends
        ? `M${f(bx)} ${f(by + rad)}A${f(rad)} ${f(rad)} 0 0 1 ${f(bx + bw)} ${f(by + rad)}V${f(by + bh - rad)}A${f(rad)} ${f(rad)} 0 0 1 ${f(bx)} ${f(by + bh - rad)}Z`
        : `M${f(bx + rad)} ${f(by)}H${f(bx + bw - rad)}A${f(rad)} ${f(rad)} 0 0 1 ${f(bx + bw - rad)} ${f(by + bh)}H${f(bx + rad)}A${f(rad)} ${f(rad)} 0 0 1 ${f(bx + rad)} ${f(by)}Z`;
    }
  } else {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!on(r, c)) continue; const [x, y] = cell(r, c);
      const R = C / 2, up = on(r - 1, c), dn = on(r + 1, c), lf = on(r, c - 1), rt = on(r, c + 1);
      if (s.body === "fluid") d += rr(x - 0.12, y - 0.12, C + 0.24, C + 0.24, [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0]);   // corners round only where nothing joins
      else if (s.body === "classy") d += rr(x - 0.12, y - 0.12, C + 0.24, C + 0.24, [!up && !lf ? R * 0.9 : 0, 0, !dn && !rt ? R * 0.9 : 0, 0]);
      else if (s.body === "small") d += shape("square", x + C * 0.12, y + C * 0.12, C * 0.76, 0);
      else if (s.body === "tiny") d += shape("circle", x + C * 0.13, y + C * 0.13, C * 0.74, 0);
      else if (s.body === "star" || s.body === "heart" || s.body === "plus" || s.body === "hexagon") d += shape(s.body, x - C * 0.04, y - C * 0.04, C * 1.08, 0);
      else if (s.body === "dots") d += shape("circle", x + C * 0.07, y + C * 0.07, C * 0.86, 0);
      else if (s.body === "diamond") d += shape("diamond", x - C * 0.04, y - C * 0.04, C * 1.08, 0);
      else if (s.body === "rounded") d += shape("rounded", x + C * 0.03, y + C * 0.03, C * 0.94, C * 0.34);
      else if (s.body === "leaf") d += shape("leaf", x + C * 0.02, y + C * 0.02, C * 0.96, C * 0.5);
      else d += `M${f(x - 0.15)} ${f(y - 0.15)}h${C + 0.3}v${C + 0.3}h${-C - 0.3}Z`;    // tiny overlap so no hairline gaps show
    }
  }

  // the three corner eyes
  let eyes = "";
  for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = ox + c0 * C, y = oy + r0 * C, W7 = 7 * C, W5 = 5 * C, W3 = 3 * C;
    const rOut = s.eyeOuter === "rounded" ? 2.2 * C : 2.8 * C, rIn = s.eyeOuter === "rounded" ? 1.2 * C : 1.8 * C;
    eyes += `<path fill="${fillEye}" fill-rule="evenodd" d="${shape(s.eyeOuter, x, y, W7, rOut)}${shape(s.eyeOuter, x + C, y + C, W5, rIn)}"/>`;
    const ik = s.eyeInner, ir = ik === "rounded" ? 0.9 * C : 1.5 * C, big = ik === "star" ? 0.35 * C : 0;   // the star is drawn a little larger so they fill the centre
    eyes += `<path fill="${fillEye}" d="${shape(ik, x + 2 * C - big, y + 2 * C - big, W3 + 2 * big, ir)}"/>`;
  }

  // logo
  let logo = "";
  if (s.logo) {
    const x = ox + lx0 * C, y = oy + ly0 * C, sz = lsize * C, p = 0.7 * C;
    logo = `<rect x="${f(x - p / 2)}" y="${f(y - p / 2)}" width="${f(sz + p)}" height="${f(sz + p)}" rx="${f((sz + p) * 0.22)}" fill="${bg || "#ffffff"}"/>`
      + `<clipPath id="qc"><rect x="${f(x)}" y="${f(y)}" width="${f(sz)}" height="${f(sz)}" rx="${f(sz * 0.18)}"/></clipPath>`
      + `<image href="${esc(s.logo)}" x="${f(x)}" y="${f(y)}" width="${f(sz)}" height="${f(sz)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#qc)"/>`;
  }

  // frame and label
  const frameCol = s.gradient === "none" ? col : col, ink = luminance(frameCol) > 0.5 ? "#111111" : "#ffffff";
  let frame = "";
  const labelText = (cy: number, fill: string) => `<text x="${f(totalW / 2)}" y="${f(cy + 1.05 * C)}" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="800" font-size="${f(2.9 * C)}" fill="${fill}">${esc(label)}</text>`;
  if (s.frame === "box") frame += `<rect x="${C * 0.3}" y="${C * 0.3}" width="${f(totalW - C * 0.6)}" height="${f(totalH - C * 0.6)}" rx="${C * 2.4}" fill="none" stroke="${frameCol}" stroke-width="${C * 0.6}"/>`;
  if (s.frame === "badge") {           // thick border, the label sits in a solid band at the bottom
    const bh = labelH + C * 0.6;
    frame += `<rect x="${C * 0.4}" y="${C * 0.4}" width="${f(totalW - C * 0.8)}" height="${f(totalH - C * 0.8)}" rx="${C * 2.4}" fill="none" stroke="${frameCol}" stroke-width="${C * 0.8}"/>`
      + `<path fill="${frameCol}" d="${rr(0, totalH - bh, totalW, bh, [0, 0, C * 2.8, C * 2.8])}"/>` + (label ? labelText(totalH - bh / 2 - 0.1 * C, ink) : "");
  } else if (s.frame !== "none" && label) {
    const bw = Math.min(totalW - 4 * C, Math.max(18 * C, label.length * 3.1 * C)), bx = (totalW - bw) / 2;
    const cy = s.frame === "box" ? totalH - 4.1 * C : s.frame === "top" ? labelH / 2 + 0.2 * C : s.frame === "bubble" ? totalH - labelH / 2 + 0.6 * C : totalH - labelH / 2 - 0.2 * C;
    frame += `<rect x="${f(bx)}" y="${f(cy - 2.4 * C)}" width="${f(bw)}" height="${f(4.8 * C)}" rx="${f(s.frame === "bubble" ? 1.2 * C : 2.4 * C)}" fill="${frameCol}"/>`;
    if (s.frame === "bubble") frame += `<path fill="${frameCol}" d="M${f(totalW / 2 - 1.6 * C)} ${f(cy - 2.35 * C)}L${f(totalW / 2)} ${f(cy - 4.2 * C)}L${f(totalW / 2 + 1.6 * C)} ${f(cy - 2.35 * C)}Z"/>`;   // speech-bubble tail pointing at the code
    frame += labelText(cy, ink);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(totalW)} ${f(totalH)}" width="${f(totalW)}" height="${f(totalH)}" shape-rendering="geometricPrecision"><defs>${defs}</defs>`
    + (bg ? `<rect width="${f(totalW)}" height="${f(totalH)}" rx="${boxed ? C * 2.8 : 0}" fill="${bg}"/>` : "")
    + `<path fill="${fillBody}" d="${d}"/>${eyes}${logo}${frame}</svg>`;
  return { svg, width: totalW, height: totalH, modules: n };
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Renders the SVG to a PNG of the given width (browser only). */
export async function svgToPng(r: QrResult, width = 1200): Promise<Blob> {
  const img = new Image(); img.src = svgDataUrl(r.svg); await img.decode();
  const c = document.createElement("canvas"); c.width = width; c.height = Math.round((width * r.height) / r.width);
  const g = c.getContext("2d")!; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
}
