"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import PdfShell, { JobStatus, PartsList, outName, useJob, type Part } from "@/components/PdfShell";
import { addPageNumbers, addWatermark, cropResize, flipPages, nUp, rotatePages, setDetails, readDetails } from "@/lib/pdfOps";
import { rasterize } from "@/lib/rasterPdf";

type StepType = "rotate" | "flip" | "watermark" | "numbers" | "nup" | "crop" | "details" | "compress";
interface Step { id: number; type: StepType; angle: 90 | 180 | 270; axis: "horizontal" | "vertical"; text: string; format: string; per: 2 | 4 | 6 | 9; mm: number; title: string; author: string; level: "balanced" | "strong" }

const labels: Record<StepType, string> = {
  rotate: "Rotate pages", flip: "Flip (mirror) pages", watermark: "Add watermark", numbers: "Add page numbers", nup: "Multiple pages per sheet",
  crop: "Trim margins", details: "Set title / author", compress: "Compress (pages become images)",
};
let nextId = 1;
const fresh = (type: StepType): Step => ({ id: nextId++, type, angle: 90, axis: "horizontal", text: "CONFIDENTIAL", format: "Page {n} of {total}", per: 4, mm: 10, title: "", author: "", level: "balanced" });

async function applyStep(bytes: Uint8Array, s: Step): Promise<Uint8Array> {
  switch (s.type) {
    case "rotate": return rotatePages(bytes, s.angle, "all");
    case "flip": return flipPages(bytes, s.axis);
    case "watermark": return addWatermark(bytes, { text: s.text });
    case "numbers": return addPageNumbers(bytes, { format: s.format });
    case "nup": return nUp(bytes, s.per);
    case "crop": return cropResize(bytes, { top: s.mm, right: s.mm, bottom: s.mm, left: s.mm, unit: "mm" });
    case "details": return setDetails(bytes, { ...(await readDetails(bytes)), title: s.title, author: s.author });
    case "compress": return rasterize(bytes, s.level === "strong" ? 100 : 150, s.level === "strong" ? 0.5 : 0.7);
  }
}

function StepCard({ s, i, n, set, move, remove }: { s: Step; i: number; n: number; set: (p: Partial<Step>) => void; move: (d: number) => void; remove: () => void }) {
  return (
    <li className="space-y-2 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
        <b className="flex-1 text-sm">{labels[s.type]}</b>
        <button aria-label="Move up" disabled={i === 0} className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(-1)}><ArrowUp className="h-4 w-4" /></button>
        <button aria-label="Move down" disabled={i === n - 1} className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(1)}><ArrowDown className="h-4 w-4" /></button>
        <button aria-label="Remove step" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={remove}><X className="h-4 w-4" /></button>
      </div>
      {s.type === "rotate" && <select className="input" value={s.angle} onChange={(e) => set({ angle: +e.target.value as Step["angle"] })}><option value={90}>90° right</option><option value={180}>180°</option><option value={270}>90° left</option></select>}
      {s.type === "flip" && <select className="input" value={s.axis} onChange={(e) => set({ axis: e.target.value as Step["axis"] })}><option value="horizontal">Left ↔ right</option><option value="vertical">Top ↕ bottom</option></select>}
      {s.type === "watermark" && <input className="input" value={s.text} maxLength={60} onChange={(e) => set({ text: e.target.value })} aria-label="Watermark text" />}
      {s.type === "numbers" && <input className="input" value={s.format} onChange={(e) => set({ format: e.target.value })} aria-label="Number format" />}
      {s.type === "nup" && <select className="input" value={s.per} onChange={(e) => set({ per: +e.target.value as Step["per"] })}>{[2, 4, 6, 9].map((p) => <option key={p} value={p}>{p} pages per sheet</option>)}</select>}
      {s.type === "crop" && <div><label className="label">Margin on every side (mm)</label><input type="number" min={0} className="input" value={s.mm} onChange={(e) => set({ mm: +e.target.value || 0 })} /></div>}
      {s.type === "details" && <div className="grid gap-2 sm:grid-cols-2"><input className="input" placeholder="Title" value={s.title} onChange={(e) => set({ title: e.target.value })} /><input className="input" placeholder="Author" value={s.author} onChange={(e) => set({ author: e.target.value })} /></div>}
      {s.type === "compress" && <select className="input" value={s.level} onChange={(e) => set({ level: e.target.value as Step["level"] })}><option value="balanced">Balanced (150 DPI)</option><option value="strong">Strong (100 DPI)</option></select>}
    </li>
  );
}

export default function PdfWorkflow() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [progress, setProgress] = useState("");
  const { busy, error, run } = useJob();
  const patch = (id: number, p: Partial<Step>) => setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  return (
    <PdfShell multiple hint="Add one or more PDFs, build a recipe of steps, and run it on all of them.">
      {(files) => (
        <>
          <div><p className="label">Steps (run in order)</p>
            {steps.length === 0 && <p className="text-sm text-neutral-500">No steps yet. Add one below.</p>}
            <ol className="space-y-2">
              {steps.map((s, i) => <StepCard key={s.id} s={s} i={i} n={steps.length} set={(p) => patch(s.id, p)} remove={() => setSteps(steps.filter((x) => x.id !== s.id))}
                move={(d) => setSteps((all) => { const j = i + d; const n = [...all]; [n[i], n[j]] = [n[j], n[i]]; return n; })} />)}
            </ol></div>
          <div className="flex items-center gap-2">
            <select className="input" id="add-step" defaultValue="" onChange={(e) => { if (e.target.value) { setSteps([...steps, fresh(e.target.value as StepType)]); e.target.value = ""; } }}>
              <option value="" disabled>+ Add a step…</option>
              {(Object.keys(labels) as StepType[]).map((t) => <option key={t} value={t}>{labels[t]}</option>)}
            </select>
            <Plus className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
          </div>
          <button className="btn w-full" disabled={busy || !steps.length} onClick={() => run(async () => {
            const out: Part[] = [];
            for (let i = 0; i < files.length; i++) {
              let bytes = files[i].bytes;
              for (let k = 0; k < steps.length; k++) { setProgress(`File ${i + 1} of ${files.length}, step ${k + 1} of ${steps.length}`); bytes = await applyStep(bytes, steps[k]); }
              out.push({ name: outName(files[i].name, "-processed"), bytes });
            }
            setParts(out);
          })}>{busy ? "Running…" : `Run on ${files.length} file${files.length === 1 ? "" : "s"}`}</button>
          <JobStatus busy={busy} error={error} label={progress || "Running your workflow…"} />
          <PartsList parts={parts} zipName="workflow-results.zip" />
        </>
      )}
    </PdfShell>
  );
}
