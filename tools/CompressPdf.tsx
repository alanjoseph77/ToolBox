"use client";
import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { rasterize, rasterizeToSize } from "@/lib/rasterPdf";

type Mode = "light" | "balanced" | "strong" | "size";
const modes: { id: Mode; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "Keeps text selectable. Removes unused data." },
  { id: "balanced", label: "Balanced", hint: "Re-draws pages as images (150 DPI). Much smaller for scans." },
  { id: "strong", label: "Strong", hint: "Smallest. Pages become 100 DPI images." },
  { id: "size", label: "Fit a size", hint: "Squeeze until it is under the size you choose." },
];

async function lightCompress(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.setTitle(""); doc.setAuthor(""); doc.setSubject(""); doc.setKeywords([]); doc.setProducer(""); doc.setCreator("");
  return doc.save({ useObjectStreams: true });
}

export default function CompressPdf() {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [mode, setMode] = useState<Mode>("light");
  const [targetKb, setTargetKb] = useState(500);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const job = useRef(0);

  const run = async (f: { bytes: Uint8Array }, m: Mode, kb: number) => {
    const mine = ++job.current;
    setResult(null); setError(""); setNote(""); setBusy(true);
    try {
      let out: Uint8Array;
      if (m === "light") out = await lightCompress(f.bytes);
      else if (m === "balanced") out = await rasterize(f.bytes, 150, 0.7);
      else if (m === "strong") out = await rasterize(f.bytes, 100, 0.5);
      else { const r = await rasterizeToSize(f.bytes, kb * 1024); out = r.bytes; if (!r.reached) setNote("Could not get under that size. This is the smallest result."); }
      if (mine === job.current) setResult(out);
    } catch { if (mine === job.current) setError("Could not process this PDF. It may be encrypted or damaged."); }
    if (mine === job.current) setBusy(false);
  };
  // re-run when a file is chosen or a (non-size) mode is picked
  useEffect(() => { if (file && mode !== "size") run(file, mode, targetKb); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [file, mode]);

  const saved = file && result ? Math.max(0, Math.round((1 - result.length / file.bytes.length) * 100)) : 0;
  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={async (f) => { if (f[0]) setFile({ name: f[0].name, bytes: new Uint8Array(await f[0].arrayBuffer()) }); }} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap gap-2">{modes.map((m) => <button key={m.id} className={m.id === mode ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setMode(m.id)}>{m.label}</button>)}</div>
          <p className="text-xs text-neutral-500">{modes.find((m) => m.id === mode)!.hint}</p>
          {mode === "size" && (
            <div className="flex items-end gap-2">
              <div className="flex-1"><label className="label">Target size (KB)</label><input type="number" min={20} className="input" value={targetKb} onChange={(e) => setTargetKb(Math.max(20, +e.target.value || 20))} /></div>
              <button className="btn" disabled={busy} onClick={() => run(file, "size", targetKb)}>Compress</button>
            </div>
          )}
          <WaterLoader active={busy} label="Optimising your PDF…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <div className="space-y-3">
              <p className="text-sm">{formatBytes(file.bytes.length)} → <b>{formatBytes(result.length)}</b> ({saved}% smaller)</p>
              {note && <p className="text-xs text-neutral-600">{note}</p>}
              {result.length >= file.bytes.length && <p className="text-xs text-neutral-600">This PDF is already well optimised in this mode. Try Balanced or Strong for more savings.</p>}
              {mode !== "light" && <p className="text-xs text-neutral-500">Pages were converted to images, so text can no longer be selected.</p>}
              <button className="btn w-full" disabled={result.length >= file.bytes.length} onClick={() => download(result, file.name.replace(/\.pdf$/i, "") + "-compressed.pdf", "application/pdf")}>Download compressed PDF</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
