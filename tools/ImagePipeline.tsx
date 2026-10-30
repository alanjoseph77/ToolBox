"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import { JobStatus, PartsList, useJob, type Part } from "@/components/PdfShell";
import { formatBytes } from "@/lib/files";
import { fmtExt, runPipeline, type Fmt, type PipelineOptions } from "@/lib/imagePipeline";

const presets = [
  { label: "Passport 413×531", w: 413, h: 531, mode: "exact" as const }, { label: "Exam photo 200×230", w: 200, h: 230, mode: "exact" as const },
  { label: "Signature 140×60", w: 140, h: 60, mode: "exact" as const }, { label: "Max 1080 px", w: 1080, h: 1080, mode: "fit" as const },
  { label: "Max 1920 px", w: 1920, h: 1920, mode: "fit" as const },
];

function Step({ n, title, on, setOn, children }: { n: number; title: string; on: boolean; setOn: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 rounded-xl border p-4 ${on ? "" : "opacity-60"}`}>
      <label className="flex items-center gap-3 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} aria-label={`Use step ${n}`} /> {title}
      </label>
      {on && children}
    </div>
  );
}

export default function ImagePipeline() {
  const [files, setFiles] = useState<File[]>([]);
  const [rs, setRs] = useState<PipelineOptions["resize"]>({ on: true, mode: "fit", w: 1080, h: 1080, pct: 50 });
  const [cp, setCp] = useState({ on: true, kb: 100 });
  const [format, setFormat] = useState<Fmt>("jpeg");
  const [parts, setParts] = useState<(Part & { info: string })[]>([]);
  const { busy, error, run } = useJob();

  const go = () => run(async () => {
    const out: (Part & { info: string })[] = [];
    for (const f of files) {
      const r = await runPipeline(f, { resize: rs, compress: cp, format });
      out.push({ name: f.name.replace(/\.[^.]+$/, "") + "-processed." + fmtExt[format], bytes: new Uint8Array(await r.blob.arrayBuffer()), type: r.blob.type, info: `${f.name}: ${formatBytes(f.size)} → ${formatBytes(r.blob.size)} · ${r.w}×${r.h}px${r.note ? " · " + r.note : ""}` });
    }
    setParts(out);
  });

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={(f) => setFiles((p) => [...p, ...f.filter((x) => x.type.startsWith("image/"))])} hint="Add one or many photos. They go through every step you switch on, in order." />
      {files.length > 0 && (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          <ul className="flex flex-wrap gap-2 text-sm">{files.map((f, i) => <li key={f.name + i} className="chip">{f.name}<button aria-label={`Remove ${f.name}`} className="ml-1" onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button></li>)}</ul>

          <Step n={1} title="Resize" on={rs.on} setOn={(on) => setRs({ ...rs, on })}>
            <div className="flex flex-wrap gap-2">{presets.map((p) => <button key={p.label} className="btn-ghost !min-h-0 !py-1 text-xs" onClick={() => setRs({ ...rs, mode: p.mode, w: p.w, h: p.h })}>{p.label}</button>)}
              <button className="btn-ghost !min-h-0 !py-1 text-xs" onClick={() => setRs({ ...rs, mode: "percent", pct: 50 })}>Half size</button></div>
            <div className="flex flex-wrap items-end gap-3">
              <div><label className="label">Mode</label><select className="input" value={rs.mode} onChange={(e) => setRs({ ...rs, mode: e.target.value as typeof rs.mode })}><option value="fit">Fit inside (keep shape)</option><option value="exact">Exact size</option><option value="percent">Percent</option></select></div>
              {rs.mode === "percent" ? <div><label className="label">Percent</label><input type="number" className="input !w-24" value={rs.pct} onChange={(e) => setRs({ ...rs, pct: +e.target.value || 100 })} /></div>
                : <><div><label className="label">Width px</label><input type="number" className="input !w-28" value={rs.w} onChange={(e) => setRs({ ...rs, w: +e.target.value || 0 })} /></div>
                  <div><label className="label">Height px</label><input type="number" className="input !w-28" value={rs.h} onChange={(e) => setRs({ ...rs, h: +e.target.value || 0 })} /></div></>}
            </div>
          </Step>

          <Step n={2} title="Convert" on={true} setOn={() => {}}>
            <div className="flex gap-2">{(["jpeg", "png", "webp"] as Fmt[]).map((f) => <button key={f} className={f === format ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setFormat(f)}>{f === "jpeg" ? "JPG" : f.toUpperCase()}</button>)}</div>
          </Step>

          <Step n={3} title="Compress to a size" on={cp.on} setOn={(on) => setCp({ ...cp, on })}>
            <div className="flex flex-wrap items-center gap-2">{[20, 50, 100, 200, 500].map((k) => <button key={k} className={cp.kb === k ? "btn !min-h-0 !py-1" : "btn-ghost !min-h-0 !py-1"} onClick={() => setCp({ ...cp, kb: k })}>{k} KB</button>)}
              <input type="number" className="input !w-24" value={cp.kb} onChange={(e) => setCp({ ...cp, kb: +e.target.value || 100 })} aria-label="Target size in KB" /></div>
            {format === "png" && <p className="text-xs text-neutral-500">PNG can&apos;t be squeezed to a size. Pick JPG or WebP for this step.</p>}
          </Step>

          <button className="btn w-full" disabled={busy} onClick={go}>{busy ? "Processing…" : `Run on ${files.length} photo${files.length === 1 ? "" : "s"}`}</button>
          <JobStatus busy={busy} error={error} label="Resizing, converting and compressing…" />
          {parts.length > 0 && <ul className="space-y-1 text-sm text-neutral-600">{parts.map((p) => <li key={p.name}>{p.info}</li>)}</ul>}
          <PartsList parts={parts} zipName="processed-photos.zip" />
        </div>
      )}
    </div>
  );
}
