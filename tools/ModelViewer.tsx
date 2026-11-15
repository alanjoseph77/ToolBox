"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";

const ACCEPT = ".glb,.gltf,.stl,.obj,.ply,.3mf,.fbx,.dae";
const BGS: Record<string, number> = { Light: 0xf4f4f5, Grey: 0x8a8f98, Dark: 0x15161a };
const zUp = (ext: string) => ext === "stl" || ext === "ply";          // these formats are Z-up, three.js is Y-up

type Stats = { name: string; ext: string; size: string; tris: number; verts: number; meshes: number; dims: string };

export default function ModelViewer() {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);                       // everything three.js lives here, outside React state
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wire, setWire] = useState(false);
  const [grid, setGrid] = useState(true);
  const [spin, setSpin] = useState(false);
  const [bg, setBg] = useState("Light");

  // ---- one-time scene setup ----
  useEffect(() => {
    let dead = false, raf = 0, ro: ResizeObserver | undefined;
    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (dead || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement); renderer.domElement.style.display = "block";
      const scene = new THREE.Scene(); scene.background = new THREE.Color(BGS.Light);
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(3, 5, 4); scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 0.5));
      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
      const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
      const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0xbbbbbb); scene.add(gridHelper);
      const size = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); };
      size(); ro = new ResizeObserver(size); ro.observe(el);
      const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
      loop();
      api.current = { THREE, scene, camera, controls, renderer, gridHelper, model: null as any, home: null as any };
    })();
    return () => {
      dead = true; cancelAnimationFrame(raf); ro?.disconnect();
      const a = api.current; if (a) { a.renderer.dispose(); a.renderer.domElement.remove(); }
      api.current = null;
    };
  }, []);

  // ---- toggles ----
  useEffect(() => { const a = api.current; if (!a) return; a.gridHelper.visible = grid; }, [grid, stats]);
  useEffect(() => { const a = api.current; if (!a) return; a.controls.autoRotate = spin; a.controls.autoRotateSpeed = 2; }, [spin, stats]);
  useEffect(() => { const a = api.current; if (!a) return; a.scene.background = new a.THREE.Color(BGS[bg]); a.gridHelper.material.opacity = 1; }, [bg, stats]);
  useEffect(() => {
    const a = api.current; if (!a?.model) return;
    a.model.traverse((o: any) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m.wireframe = wire; }); });
  }, [wire, stats]);

  const frame = () => {
    const a = api.current; if (!a?.model) return;
    const { THREE, camera, controls, model, gridHelper } = a;
    const box = new THREE.Box3().setFromObject(model), sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const r = Math.max(sz.x, sz.y, sz.z) || 1;
    model.position.sub(new THREE.Vector3(c.x, box.min.y, c.z)); model.updateMatrixWorld(true);   // stand on the grid, centred
    const s = r / 10; gridHelper.scale.setScalar(s * 2.2); gridHelper.position.y = 0;
    const dist = (r / 2) / Math.tan((camera.fov * Math.PI) / 360) * 1.45;
    camera.near = r / 1000; camera.far = r * 100; camera.updateProjectionMatrix();
    controls.target.set(0, sz.y / 2, 0); camera.position.set(dist * 0.7, sz.y / 2 + dist * 0.5, dist * 0.8); controls.update();
    a.home = { pos: camera.position.clone(), target: controls.target.clone() };
  };

  const open = async (files: File[]) => {
    const f = files[0]; const a = api.current;
    if (!f) return;
    if (!a) { setError("The 3D view is still starting. Try again in a second."); return; }
    setError(""); setBusy(true);
    try {
      const { THREE } = a, ext = f.name.split(".").pop()!.toLowerCase();
      const buf = await f.arrayBuffer(), text = () => new TextDecoder().decode(buf);
      let obj: any;
      if (ext === "glb" || ext === "gltf") {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        obj = (await new GLTFLoader().parseAsync(ext === "gltf" ? text() : buf, "")).scene;
      } else if (ext === "stl") {
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
        const g = new STLLoader().parse(buf); if (!g.getAttribute("normal")) g.computeVertexNormals();
        obj = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.15, roughness: 0.55, side: THREE.DoubleSide }));
      } else if (ext === "ply") {
        const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader.js");
        const g = new PLYLoader().parse(buf); if (!g.getAttribute("normal") && g.index) g.computeVertexNormals();
        const hasCol = !!g.getAttribute("color");
        obj = g.index || g.getAttribute("normal") ? new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: hasCol ? 0xffffff : 0x9aa7b8, vertexColors: hasCol, side: THREE.DoubleSide, roughness: 0.6 }))
          : new THREE.Points(g, new THREE.PointsMaterial({ size: 0.01, vertexColors: hasCol, color: hasCol ? 0xffffff : 0x335 }));
      } else if (ext === "obj") {
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
        obj = new OBJLoader().parse(text());
        obj.traverse((o: any) => { if (o.isMesh) { if (!o.geometry.getAttribute("normal")) o.geometry.computeVertexNormals(); o.material = new THREE.MeshStandardMaterial({ color: 0xb8bfca, roughness: 0.6, side: THREE.DoubleSide }); } });
      } else if (ext === "3mf") {
        const { ThreeMFLoader } = await import("three/examples/jsm/loaders/3MFLoader.js");
        obj = new ThreeMFLoader().parse(buf);
      } else if (ext === "fbx") {
        const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
        obj = new FBXLoader().parse(buf, "");
      } else if (ext === "dae") {
        const { ColladaLoader } = await import("three/examples/jsm/loaders/ColladaLoader.js");
        obj = new ColladaLoader().parse(text(), "")!.scene;
      } else throw new Error("format");
      const root = new THREE.Group(); root.add(obj); if (zUp(ext)) root.rotation.x = -Math.PI / 2;
      if (a.model) { a.scene.remove(a.model); a.model.traverse((o: any) => { o.geometry?.dispose?.(); }); }
      a.scene.add(root); a.model = root; root.updateMatrixWorld(true);
      let tris = 0, verts = 0, meshes = 0;
      root.traverse((o: any) => { if (o.isMesh) { meshes++; const g = o.geometry, p = g.getAttribute("position"); verts += p.count; tris += g.index ? g.index.count / 3 : p.count / 3; } });
      const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new THREE.Vector3());
      frame();
      setStats({ name: f.name, ext, size: formatBytes(f.size), tris: Math.round(tris), verts, meshes, dims: [sz.x, sz.y, sz.z].map((v) => +v.toPrecision(4)).join(" × ") });
      setWire(false);
    } catch (e: any) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      setError(ext === "gltf" ? "This .gltf needs separate texture or .bin files. Export it as a single .glb (or an embedded .gltf) and open that."
        : "Could not read that model. It may be damaged, or saved in an unsupported variant of the format.");
      console.warn(e);
    }
    setBusy(false);
  };

  const shot = () => { const a = api.current; if (!a) return; a.renderer.render(a.scene, a.camera); a.renderer.domElement.toBlob((b: Blob | null) => b && download(b, "model.png", "image/png")); };
  const reset = () => { const a = api.current; if (!a?.home) return; a.camera.position.copy(a.home.pos); a.controls.target.copy(a.home.target); a.controls.update(); };

  const exportAs = async (fmt: "glb" | "stl" | "obj" | "ply") => {
    const a = api.current; if (!a?.model || !stats) return;
    const { THREE } = a, base = stats.name.replace(/\.[^.]+$/, "");
    setError("");
    try {
      const g = new THREE.Group(), copy = a.model.clone(true); copy.position.set(0, 0, 0); g.add(copy);
      if (fmt === "stl" || fmt === "ply") g.rotation.x = Math.PI / 2;     // back to Z-up, as 3D printing software expects
      g.updateMatrixWorld(true);
      if (fmt === "glb") {
        const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
        const out = await new GLTFExporter().parseAsync(g, { binary: true }); download(new Blob([out as ArrayBuffer], { type: "model/gltf-binary" }), `${base}.glb`);
      } else if (fmt === "stl") {
        const { STLExporter } = await import("three/examples/jsm/exporters/STLExporter.js");
        const out: any = new STLExporter().parse(g, { binary: true }); download(new Blob([out], { type: "model/stl" }), `${base}.stl`);
      } else if (fmt === "obj") {
        const { OBJExporter } = await import("three/examples/jsm/exporters/OBJExporter.js");
        download(new Blob([new OBJExporter().parse(g)], { type: "text/plain" }), `${base}.obj`);
      } else {
        const { PLYExporter } = await import("three/examples/jsm/exporters/PLYExporter.js");
        const out: any = await new Promise((res) => { (new PLYExporter() as any).parse(g, res, { binary: true }); });
        download(new Blob([out], { type: "application/octet-stream" }), `${base}.ply`);
      }
    } catch (e) { console.warn(e); setError("Could not convert this model to that format."); }
  };

  const chk = (label: string, v: boolean, set: (b: boolean) => void) => (
    <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}</label>
  );

  return (
    <div className="space-y-4">
      <Dropzone accept={ACCEPT} onFiles={open} hint="GLB, glTF, STL, OBJ, PLY, 3MF, FBX or DAE. Opens on your device, nothing is uploaded." />
      {busy && <p className="text-sm text-neutral-500">Opening model…</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div ref={host} data-testid="viewer" className="h-[60vh] min-h-[320px] w-full overflow-hidden rounded-xl border bg-neutral-100 touch-none" />
      {stats && (
        <>
          <div className="rounded-xl border bg-white p-3 text-sm text-neutral-700" data-testid="stats">
            <p className="font-semibold">{stats.name} <span className="font-normal text-neutral-500">({stats.size})</span></p>
            <p>{stats.tris.toLocaleString()} triangles · {stats.verts.toLocaleString()} vertices · {stats.meshes} mesh{stats.meshes === 1 ? "" : "es"}</p>
            <p>Size: {stats.dims} (model units, usually mm for STL, metres for GLB)</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {chk("Wireframe", wire, setWire)}{chk("Grid", grid, setGrid)}{chk("Auto-rotate", spin, setSpin)}
            <label className="flex items-center gap-2 text-sm">Background
              <select className="rounded-lg border px-2 py-2" value={bg} onChange={(e) => setBg(e.target.value)}>{Object.keys(BGS).map((k) => <option key={k}>{k}</option>)}</select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={reset}>Reset view</button>
            <button className="btn-ghost" onClick={shot}>Save picture (PNG)</button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Convert and download</p>
            <div className="flex flex-wrap gap-2">
              {(["glb", "stl", "obj", "ply"] as const).map((f) => <button key={f} className="btn" onClick={() => exportAs(f)}>{f.toUpperCase()}</button>)}
            </div>
            <p className="mt-2 text-xs text-neutral-500">GLB works on the web, phones, AR and game engines. STL is for 3D printing. OBJ and PLY open in Blender, MeshLab and most other apps.</p>
          </div>
        </>
      )}
    </div>
  );
}
