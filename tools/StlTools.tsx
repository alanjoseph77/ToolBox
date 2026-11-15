"use client";
import { useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";
import { centeredOnBed, measure, mirrored, parseStl, scaled, writeStl, type Mesh } from "@/lib/stl";

const MATERIALS: Record<string, number> = { "PLA": 1.24, "PETG": 1.27, "ABS / ASA": 1.05, "TPU": 1.21, "Resin": 1.1 };

export default function StlTools() {
  const mesh = useRef<Mesh | null>(null);
  const name = useRef("model");
  const [m, setM] = useState<ReturnType<typeof measure> | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [mat, setMat] = useState("PLA");
  const [infill, setInfill] = useState(15);
  const [error, setError] = useState("");
  const [pct, setPct] = useState(100);
  const [target, setTarget] = useState(50);

  const set = (x: Mesh) => { mesh.current = x; setM(measure(x)); };
  const open = async (files: File[]) => {
    setError("");
    try { const buf = await files[0].arrayBuffer(); name.current = files[0].name.replace(/\.stl$/i, ""); setFileSize(files[0].size); set(parseStl(buf)); }
    catch { setError("That does not look like a valid STL file."); }
  };
  const apply = (fn: (x: Mesh) => Mesh) => { if (mesh.current) set(fn(mesh.current)); };

  // estimate: outer walls (3 x 0.4 mm) + infill on the rest; printing speed varies, so this is only a guide
  const est = (() => {
    if (!m) return null;
    const wall = Math.min(m.volume, m.area * 1.2), solid = wall + Math.max(0, m.volume - wall) * (infill / 100);
    const grams = (solid / 1000) * MATERIALS[mat];
    const seconds = solid / 8.5 + (m.size[2] / 0.2) * 4 + 120;                     // about 8.5 mm3/s of plastic, 4 s per 0.2 mm layer, 2 min warm-up
    return { grams, hours: seconds / 3600 };
  })();
  const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1));

  return (
    <div className="space-y-4">
      <Dropzone accept=".stl" onFiles={open} hint="Binary or ASCII STL. Opens on your device, nothing is uploaded." />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {m && (
        <>
          <div className="rounded-xl border bg-white p-4 text-sm space-y-1" data-testid="stl-info">
            <p className="font-semibold">{name.current}.stl <span className="font-normal text-neutral-500">({formatBytes(fileSize)})</span></p>
            <p>Size: <b>{m.size.map((v) => +v.toFixed(2)).join(" × ")}</b> mm (X × Y × Z)</p>
            <p>Volume: <b>{(m.volume / 1000).toFixed(2)} cm³</b> · Surface: {(m.area / 100).toFixed(1)} cm² · {m.triangles.toLocaleString()} triangles</p>
            <p className={m.openEdges || m.inside_out ? "text-amber-700" : "text-green-700"}>
              {m.openEdges ? `Not watertight: ${m.openEdges.toLocaleString()} open edges. Many slicers repair this, but check before printing.` : m.inside_out ? "Closed, but faces point inwards. Most slicers fix this." : "Watertight: ready to slice."}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-3 text-sm">
            <p className="font-medium">Print estimate</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">Material <select className="rounded-lg border px-2 py-2" value={mat} onChange={(e) => setMat(e.target.value)}>{Object.keys(MATERIALS).map((k) => <option key={k}>{k}</option>)}</select></label>
              <label className="flex items-center gap-2">Infill <input type="number" min={0} max={100} className="input w-20" value={infill} onChange={(e) => setInfill(Math.min(100, Math.max(0, +e.target.value)))} /> %</label>
            </div>
            {est && <p data-testid="stl-est">About <b>{fmt(est.grams)} g</b> of filament and <b>{est.hours < 1 ? `${Math.round(est.hours * 60)} min` : `${est.hours.toFixed(1)} h`}</b>. A rough guide (±30%), your slicer gives the exact numbers.</p>}
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-3 text-sm">
            <p className="font-medium">Change the model</p>
            <div className="flex flex-wrap items-center gap-2">
              <input aria-label="Scale percent" type="number" min={1} className="input w-24" value={pct} onChange={(e) => setPct(+e.target.value)} /> %
              <button className="btn-ghost" onClick={() => pct > 0 && apply((x) => scaled(x, pct / 100))}>Scale</button>
              <span className="mx-2 text-neutral-400">or</span>
              <span>longest side</span><input aria-label="Longest side mm" type="number" min={1} className="input w-24" value={target} onChange={(e) => setTarget(+e.target.value)} /> mm
              <button className="btn-ghost" onClick={() => target > 0 && apply((x) => scaled(x, target / Math.max(...measure(x).size)))}>Fit</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["X", "Y", "Z"] as const).map((a, i) => <button key={a} className="btn-ghost" onClick={() => apply((x) => mirrored(x, i as 0 | 1 | 2))}>Mirror {a}</button>)}
              <button className="btn-ghost" onClick={() => apply(centeredOnBed)}>Centre on bed</button>
            </div>
          </div>
          <button className="btn w-full" onClick={() => mesh.current && download(writeStl(mesh.current), `${name.current}-edited.stl`, "model/stl")}>Download STL</button>
        </>
      )}
    </div>
  );
}
