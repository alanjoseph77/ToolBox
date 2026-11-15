// Small STL toolkit: parse (binary or ASCII), measure, transform and write binary STL. Units are whatever the file uses (normally mm).
export interface Mesh { tris: Float32Array }                       // 9 numbers per triangle

export function parseStl(buf: ArrayBuffer): Mesh {
  const dv = new DataView(buf);
  if (buf.byteLength >= 84) { const n = dv.getUint32(80, true); if (84 + n * 50 === buf.byteLength) {
    const t = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) t[i * 9 + k] = dv.getFloat32(84 + i * 50 + 12 + k * 4, true);
    return { tris: t };
  } }
  const txt = new TextDecoder().decode(buf), out: number[] = [], re = /vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g;
  let m: RegExpExecArray | null; while ((m = re.exec(txt))) out.push(+m[1], +m[2], +m[3]);
  if (!out.length || out.length % 9) throw new Error("not an STL");
  return { tris: Float32Array.from(out) };
}

export function writeStl(m: Mesh): Uint8Array {
  const n = m.tris.length / 9, out = new Uint8Array(84 + n * 50), dv = new DataView(out.buffer);
  new TextEncoder().encodeInto("ToolBox STL", out); dv.setUint32(80, n, true);
  for (let i = 0; i < n; i++) {
    const a = i * 9, o = 84 + i * 50, t = m.tris;
    const ux = t[a + 3] - t[a], uy = t[a + 4] - t[a + 1], uz = t[a + 5] - t[a + 2], vx = t[a + 6] - t[a], vy = t[a + 7] - t[a + 1], vz = t[a + 8] - t[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    [nx, ny, nz].forEach((v, k) => dv.setFloat32(o + k * 4, v, true)); for (let k = 0; k < 9; k++) dv.setFloat32(o + 12 + k * 4, t[a + k], true);
  }
  return out;
}

export function measure(m: Mesh) {
  const t = m.tris, min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  let vol = 0, area = 0;
  for (let i = 0; i < t.length; i += 9) {
    for (let k = 0; k < 9; k++) { const d = k % 3; if (t[i + k] < min[d]) min[d] = t[i + k]; if (t[i + k] > max[d]) max[d] = t[i + k]; }
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = [t[i], t[i + 1], t[i + 2], t[i + 3], t[i + 4], t[i + 5], t[i + 6], t[i + 7], t[i + 8]];
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    area += Math.hypot((by - ay) * (cz - az) - (bz - az) * (cy - ay), (bz - az) * (cx - ax) - (bx - ax) * (cz - az), (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  }
  // watertight = every edge is shared by exactly one forward and one backward triangle
  const q = (x: number) => Math.round(x * 1000), key = (i: number) => `${q(t[i])},${q(t[i + 1])},${q(t[i + 2])}`, edges = new Map<string, number>();
  const bump = (a: string, b: string) => { const k = a < b ? `${a}|${b}` : `${b}|${a}`, d = a < b ? 1 : -1; edges.set(k, (edges.get(k) ?? 0) + d); };
  const seen = new Set<string>();
  for (let i = 0; i < t.length; i += 9) { const p = [key(i), key(i + 3), key(i + 6)]; for (let k = 0; k < 3; k++) { bump(p[k], p[(k + 1) % 3]); seen.add(p[k] < p[(k + 1) % 3] ? `${p[k]}|${p[(k + 1) % 3]}` : `${p[(k + 1) % 3]}|${p[k]}`); } }
  let open = 0; for (const k of seen) if (edges.get(k) !== 0) open++;
  return { min, max, size: max.map((v, i) => v - min[i]), volume: Math.abs(vol), inside_out: vol < 0, area, triangles: t.length / 9, openEdges: open };
}

export const scaled = (m: Mesh, f: number): Mesh => ({ tris: m.tris.map((v) => v * f) });
export function mirrored(m: Mesh, axis: 0 | 1 | 2): Mesh {          // flip one axis and swap two corners so faces still point outwards
  const t = Float32Array.from(m.tris);
  for (let i = 0; i < t.length; i += 9) { t[i + axis] = -t[i + axis]; t[i + 3 + axis] = -t[i + 3 + axis]; t[i + 6 + axis] = -t[i + 6 + axis]; for (let k = 0; k < 3; k++) { const s = t[i + 3 + k]; t[i + 3 + k] = t[i + 6 + k]; t[i + 6 + k] = s; } }
  return { tris: t };
}
export function centeredOnBed(m: Mesh): Mesh {                         // centre X/Y on 0 and put the lowest point on Z = 0
  const { min, max } = measure({ tris: m.tris }), t = Float32Array.from(m.tris), cx = (min[0] + max[0]) / 2, cy = (min[1] + max[1]) / 2;
  for (let i = 0; i < t.length; i += 3) { t[i] -= cx; t[i + 1] -= cy; t[i + 2] -= min[2]; }
  return { tris: t };
}
