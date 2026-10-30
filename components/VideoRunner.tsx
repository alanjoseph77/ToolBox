"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { download, formatBytes } from "@/lib/files";
import { runFFmpeg } from "@/lib/ffmpeg";

export interface VideoCtx { video: HTMLVideoElement | null; duration: number }

interface Props {
  accept?: string;
  outName: string | ((f: File) => string);
  mime: string | ((f: File) => string);
  args: (input: string, f: File) => string[];
  controls?: (ctx: VideoCtx) => ReactNode;
  cta: string;
  result?: "video" | "audio" | "image";
}

export default function VideoRunner({ accept = "video/*", outName, mime, args, controls, cta, result = "video" }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState("");
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const pick = (f: File[]) => {
    if (!f[0]) return;
    setFile(f[0]); setOut(null); setError(""); setDuration(0); setSrc(URL.createObjectURL(f[0]));
  };

  const run = async () => {
    setBusy(true); setError(""); setOut(null); setProgress(0);
    try {
      const name = typeof outName === "function" ? outName(file!) : outName;
      const type = typeof mime === "function" ? mime(file!) : mime;
      const blob = await runFFmpeg(file!, (i) => args(i, file!), name, type, setProgress);
      setOut({ blob, url: URL.createObjectURL(blob), name });
    } catch (e) { setError((e as Error).message || "Processing failed."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept={accept} onFiles={pick} hint="Processed on your device. Large videos can take a few minutes on a phone." />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{file.name} · {formatBytes(file.size)}{duration ? ` · ${duration.toFixed(1)}s` : ""}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} src={src} controls className="max-h-60 w-full rounded bg-black" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)} />
          {controls?.({ video: videoRef.current, duration })}
          <button className="btn w-full" disabled={busy} onClick={run}>{busy ? `Processing… ${Math.round(progress * 100)}%` : cta}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {out && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-sm">Done: <b>{formatBytes(out.blob.size)}</b>{file.size > 0 && result === "video" ? ` (${Math.round((out.blob.size / file.size) * 100)}% of original)` : ""}</p>
              {result === "video" && <video src={out.url} controls className="max-h-60 w-full rounded bg-black" />}
              {result === "audio" && <audio src={out.url} controls className="w-full" />}
              {result === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={out.url} alt="Result" className="max-h-60 rounded border" />}
              <button className="btn w-full" onClick={() => download(out.blob, out.name)}>Download {out.name}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
