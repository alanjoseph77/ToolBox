"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileArchive, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { pageCountOf } from "@/lib/pdfOps";
import { openPdfBytes, renderPage } from "@/lib/pdfjs";
import { makeZip } from "@/lib/zip";

export interface PdfFile { id: string; name: string; bytes: Uint8Array; pages: number }
let counter = 0;

/** Picks one or more PDFs, validates them and renders `children` once enough are loaded. */
export default function PdfShell({ multiple = false, min = 1, hint, children }: {
  multiple?: boolean; min?: number; hint?: string; children: (files: PdfFile[]) => ReactNode;
}) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [error, setError] = useState("");

  const add = async (picked: File[]) => {
    setError("");
    const next: PdfFile[] = [];
    for (const f of picked.filter((x) => x.type === "application/pdf" || /\.pdf$/i.test(x.name))) {
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        next.push({ id: `f${++counter}`, name: f.name, bytes, pages: await pageCountOf(bytes) });
      } catch { setError(`“${f.name}” is not a valid PDF (or it is password protected).`); }
    }
    if (next.length) setFiles((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
  };
  const move = (i: number, d: number) => setFiles((f) => { const j = i + d; if (j < 0 || j >= f.length) return f; const n = [...f]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" multiple={multiple} onFiles={add} hint={hint} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {files.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{multiple ? `${i + 1}. ` : ""}{f.name} <span className="text-neutral-400">({f.pages} page{f.pages === 1 ? "" : "s"}, {formatBytes(f.bytes.length)})</span></span>
              {multiple && <>
                <button aria-label="Move up" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                <button aria-label="Move down" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
              </>}
              <button aria-label="Remove" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => setFiles(files.filter((x) => x.id !== f.id))}><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {files.length >= min ? <div className="space-y-4 rounded-xl border bg-white p-4">{children(files)}</div> : files.length > 0 && <p className="text-sm text-neutral-500">Add at least {min} PDFs to continue.</p>}
    </div>
  );
}

/** Runs an async action with busy / error handling. */
export function useJob() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError((e as Error).message || "Something went wrong."); }
    setBusy(false);
  }, []);
  return { busy, error, run };
}

export function JobStatus({ busy, error, label }: { busy: boolean; error: string; label: string }) {
  return <>{error && <p className="text-sm text-red-600">{error}</p>}<WaterLoader active={busy} label={label} /></>;
}

export interface Part { name: string; bytes: Uint8Array; type?: string }

/** Several result files: each one downloadable, or all together as a ZIP. */
export function PartsList({ parts, zipName = "pdf-parts.zip" }: { parts: Part[]; zipName?: string }) {
  if (!parts.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{parts.length} file{parts.length === 1 ? "" : "s"} ready</p>
      <button className="btn w-full" onClick={() => download(makeZip(parts.map((p) => ({ name: p.name, data: p.bytes }))), zipName, "application/zip")}><FileArchive className="h-4 w-4" /> Download all as ZIP</button>
      <ul className="divide-y rounded-xl border">
        {parts.map((p) => (
          <li key={p.name} className="flex items-center gap-2 p-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{p.name} <span className="text-neutral-400">({formatBytes(p.bytes.length)})</span></span>
            <button aria-label={`Download ${p.name}`} className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => download(p.bytes, p.name, p.type ?? "application/pdf")}><Download className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Live preview: renders the first page of whatever `make()` returns (debounced). */
export function PdfPreview({ make, deps }: { make: () => Promise<Uint8Array>; deps: unknown[] }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const token = useRef(0);
  useEffect(() => {
    const mine = ++token.current;
    const t = setTimeout(async () => {
      try {
        const pdf = await openPdfBytes(await make());
        const canvas = await renderPage(pdf, 1, 0.9);
        if (mine === token.current) { setUrl(canvas.toDataURL("image/jpeg", 0.8)); setErr(""); }
      } catch (e) { if (mine === token.current) setErr((e as Error).message); }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  if (err) return <p className="text-xs text-neutral-500">Preview unavailable: {err}</p>;
  if (!url) return <p className="text-xs text-neutral-500">Preparing preview…</p>;
  return (
    <div>
      <p className="label">Preview (first page)</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Preview of the result" className="max-h-80 rounded-lg border bg-white" />
    </div>
  );
}

export const outName = (original: string, suffix: string) => original.replace(/\.pdf$/i, "") + suffix + ".pdf";
