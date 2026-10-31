"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Highlighter, ImagePlus, Square, Trash2, Type } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download, loadImage } from "@/lib/files";
import { openPdf, renderPage } from "@/lib/pdfjs";

type Kind = "text" | "box" | "highlight" | "image";
interface Item { id: number; page: number; kind: Kind; x: number; y: number; w: number; h: number; text?: string; size?: number; color: string; img?: string }
let counter = 0;
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
// Standard PDF fonts only cover Latin-1, so other characters are replaced rather than failing the save.
const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/₹/g, "Rs.").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

export default function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<unknown>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageW, setPageW] = useState(595);
  const [pageH, setPageH] = useState(842);
  const [preview, setPreview] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [tool, setTool] = useState<Kind>("text");
  const [color, setColor] = useState("#000000");
  const [sel, setSel] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [k, setK] = useState(1); // screen pixels per PDF point
  const area = useRef<HTMLDivElement>(null);
  const logo = useRef<string>("");
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const draw = useRef<{ x: number; y: number } | null>(null);
  const [rubber, setRubber] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const load = async (f: File[]) => {
    if (!f[0]) return; setError("");
    try { const pdf = await openPdf(f[0]); setFile(f[0]); setDoc(pdf); setPages(pdf.numPages); setPage(1); setItems([]); setSel(null); } catch { setError("Could not open this PDF. It may be damaged or password protected."); }
  };
  useEffect(() => {
    if (!doc) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (async () => { const d = doc as any, p = await d.getPage(page), v = p.getViewport({ scale: 1 }); setPageW(v.width); setPageH(v.height); setPreview((await renderPage(d, page, 1.3)).toDataURL("image/jpeg", 0.85)); })();
  }, [doc, page]);
  useEffect(() => {
    const measure = () => area.current && setK(area.current.getBoundingClientRect().width / pageW);
    measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
  }, [pageW, preview]);

  const frac = (e: React.PointerEvent) => { const b = area.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) }; };
  const add = (it: Omit<Item, "id" | "page">) => { const id = ++counter; setItems((p) => [...p, { ...it, id, page }]); setSel(id); };
  const patch = (id: number, p: Partial<Item>) => setItems((x) => x.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-item]")) return;
    const p = frac(e);
    if (tool === "text") add({ kind: "text", x: p.x, y: p.y, w: 0.3, h: 0.04, text: "Your text", size: 14, color });
    else if (tool === "image") { if (logo.current) add({ kind: "image", x: p.x, y: p.y, w: 0.25, h: 0.12, color, img: logo.current }); else setError("Choose a picture first."); }
    else { e.currentTarget.setPointerCapture(e.pointerId); draw.current = p; }
  };
  const move = (e: React.PointerEvent) => {
    const p = frac(e);
    if (drag.current) { const d = drag.current; setItems((x) => x.map((i) => (i.id === d.id ? { ...i, x: Math.min(1 - i.w, Math.max(0, p.x - d.dx)), y: Math.min(1 - i.h, Math.max(0, p.y - d.dy)) } : i))); }
    else if (draw.current) { const a = draw.current; setRubber({ x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w: Math.abs(a.x - p.x), h: Math.abs(a.y - p.y) }); }
  };
  const up = () => {
    drag.current = null;
    if (draw.current && rubber && rubber.w > 0.01 && rubber.h > 0.005) add({ kind: tool === "highlight" ? "highlight" : "box", ...rubber, color: tool === "highlight" ? "#ffe600" : color === "#000000" ? "#ffffff" : color });
    draw.current = null; setRubber(null);
  };
  const pickImage = async (f: File[]) => {
    if (!f[0]) return; setError("");
    try { const img = await loadImage(f[0]); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d")!.drawImage(img, 0, 0); logo.current = c.toDataURL("image/png"); setTool("image"); } catch { setError("Could not read that picture."); }
  };

  const save = async () => {
    const out = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
    const font = await out.embedFont(StandardFonts.Helvetica);
    for (const it of items) {
      const pg = out.getPage(it.page - 1), { width: W, height: H } = pg.getSize();
      if (it.kind === "text") { const size = it.size ?? 14; safe(it.text ?? "").split("\n").forEach((line, n) => pg.drawText(line, { x: it.x * W, y: H - it.y * H - size * (n + 1) + size * 0.15, size, font, color: hex(it.color) })); }
      else if (it.kind === "image" && it.img) { const im = await out.embedPng(it.img); pg.drawImage(im, { x: it.x * W, y: H - (it.y + it.h) * H, width: it.w * W, height: it.h * H }); }
      else pg.drawRectangle({ x: it.x * W, y: H - (it.y + it.h) * H, width: it.w * W, height: it.h * H, color: hex(it.color), opacity: it.kind === "highlight" ? 0.4 : 1 });
    }
    download(await out.save(), file!.name.replace(/\.pdf$/i, "") + "-edited.pdf", "application/pdf");
  };

  const here = items.filter((i) => i.page === page), cur = items.find((i) => i.id === sel);
  const tools: [Kind, string, typeof Type][] = [["text", "Text", Type], ["box", "Box / whiteout", Square], ["highlight", "Highlight", Highlighter], ["image", "Picture", ImagePlus]];

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={load} hint="Add a PDF, then add text, pictures, boxes or highlights." />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {file && doc != null && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Tools">
            {tools.map(([t, l, Icon]) => <button key={t} aria-pressed={tool === t} className={tool === t ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setTool(t)}><Icon className="h-4 w-4" /> {l}</button>)}
            <input type="color" aria-label="Colour" value={color} onChange={(e) => { setColor(e.target.value); if (cur && cur.kind !== "highlight" && cur.kind !== "image") patch(cur.id, { color: e.target.value }); }} />
          </div>
          {tool === "image" && <Dropzone accept="image/*" onFiles={pickImage} hint="Add a logo, stamp or signature picture, then click on the page to place it." />}
          <p className="text-xs text-neutral-500">{tool === "text" ? "Click on the page to add text." : tool === "image" ? "Click on the page to place the picture." : "Drag on the page to draw."} Drag anything to move it.</p>
          {pages > 1 && <div className="flex items-center justify-between"><button aria-label="Previous page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button><span className="text-sm">Page {page} of {pages}</span><button aria-label="Next page" className="btn-ghost !min-h-0 !px-2 !py-1" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button></div>}
          <div ref={area} aria-label="PDF page" className="relative mx-auto w-full max-w-2xl touch-none select-none overflow-hidden rounded-lg border" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
            {preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt={`Page ${page}`} draggable={false} className="block w-full" />}
            {here.map((it) => (
              <div key={it.id} data-item={it.kind} className={`absolute cursor-move ${sel === it.id ? "outline outline-2 outline-blue-500" : ""}`}
                style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: it.kind === "text" ? undefined : `${it.w * 100}%`, height: it.kind === "text" ? undefined : `${it.h * 100}%`, background: it.kind === "box" ? it.color : it.kind === "highlight" ? `${it.color}66` : undefined, color: it.color, fontSize: `${(it.size ?? 14) * k}px`, lineHeight: 1.15, whiteSpace: "pre" }}
                onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); setSel(it.id); const p = frac(e); drag.current = { id: it.id, dx: p.x - it.x, dy: p.y - it.y }; }}
                onPointerMove={move} onPointerUp={up}>
                {it.kind === "text" && it.text}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.kind === "image" && it.img && <img src={it.img} alt="" draggable={false} className="h-full w-full object-fill" />}
              </div>
            ))}
            {rubber && <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10" style={{ left: `${rubber.x * 100}%`, top: `${rubber.y * 100}%`, width: `${rubber.w * 100}%`, height: `${rubber.h * 100}%` }} />}
          </div>
          {cur && cur.page === page && (
            <div className="space-y-2 rounded-lg border p-3" data-editor="1">
              {cur.kind === "text" && <>
                <textarea aria-label="Text" className="input h-16" value={cur.text} onChange={(e) => patch(cur.id, { text: e.target.value })} />
                <label className="text-sm font-medium">Size: {cur.size}<input type="range" min={6} max={72} value={cur.size} aria-label="Text size" onChange={(e) => patch(cur.id, { size: +e.target.value })} className="w-full" /></label>
              </>}
              {(cur.kind === "box" || cur.kind === "image") && <div className="grid grid-cols-2 gap-2 text-sm"><label>Width<input type="range" min={1} max={100} aria-label="Width" value={Math.round(cur.w * 100)} onChange={(e) => patch(cur.id, { w: Math.min(1 - cur.x, +e.target.value / 100) })} className="w-full" /></label><label>Height<input type="range" min={1} max={100} aria-label="Height" value={Math.round(cur.h * 100)} onChange={(e) => patch(cur.id, { h: Math.min(1 - cur.y, +e.target.value / 100) })} className="w-full" /></label></div>}
              <button className="btn-ghost !py-1.5" onClick={() => { setItems(items.filter((i) => i.id !== cur.id)); setSel(null); }}><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          )}
          <button className="btn w-full" disabled={!items.length} onClick={save}>{`Download edited PDF (${items.length} change${items.length === 1 ? "" : "s"})`}</button>
          <p className="text-xs text-neutral-500">Text uses a standard font, so some special characters may be replaced. Your original text stays in the file. To remove it for good, use Redact PDF.</p>
        </div>
      )}
    </div>
  );
}
