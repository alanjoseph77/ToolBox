"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download, formatBytes } from "@/lib/files";
import { runFFmpegMany } from "@/lib/ffmpeg";

interface Item { id: number; file: File }
let counter = 0;

export default function MergeAudio() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ blob: Blob; url: string } | null>(null);

  const add = (files: File[]) => { setOut(null); setError(""); setItems((p) => [...p, ...files.map((file) => ({ id: ++counter, file }))]); };
  const move = (i: number, d: number) => setItems((p) => { const j = i + d; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const run = async () => {
    setBusy(true); setError(""); setOut(null); setProgress(0);
    try {
      const n = items.length;
      const blob = await runFFmpegMany(items.map((x) => x.file), (names) => [
        ...names.flatMap((nm) => ["-i", nm]),
        "-filter_complex", `${names.map((_, k) => `[${k}:a]`).join("")}concat=n=${n}:v=0:a=1[out]`,
        "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", "merged.mp3",
      ], "merged.mp3", "audio/mpeg", setProgress);
      setOut({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { setError((e as Error).message || "Processing failed."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="audio/*,.m4a,.aac,.flac,.ogg,.opus" multiple onFiles={add} hint="Add two or more audio files, then put them in order." />
      {items.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="flex-1 truncate">{i + 1}. {it.file.name} <span className="text-neutral-500">({formatBytes(it.file.size)})</span></span>
              <button aria-label="Move up" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
              <button aria-label="Move down" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
              <button aria-label="Remove" className="btn-ghost !min-h-0 !px-2 !py-1" onClick={() => setItems(items.filter((x) => x.id !== it.id))}><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <button className="btn w-full" disabled={items.length < 2 || busy} onClick={run}>{busy ? `Merging… ${Math.round(progress * 100)}%` : `Merge ${items.length} files`}</button>
      <WaterLoader active={busy} progress={progress} label="Joining your audio…" hints={["Audio is joined on your device", "Keep this tab open", "Almost there…"]} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && (
        <div className="space-y-2 rounded-xl border bg-white p-4">
          <p className="text-sm">Done: <b>{formatBytes(out.blob.size)}</b></p>
          <audio src={out.url} controls className="w-full" />
          <button className="btn w-full" onClick={() => download(out.blob, "merged.mp3")}>Download merged.mp3</button>
        </div>
      )}
    </div>
  );
}
