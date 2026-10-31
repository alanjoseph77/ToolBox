"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";
import { download, formatBytes } from "@/lib/files";
import { runFFmpeg } from "@/lib/ffmpeg";

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function VoiceRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const start = async () => {
    setError(""); setClip(null); setSecs(0);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Recording is not supported in this browser."); return; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream.current);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setClip({ blob, url: URL.createObjectURL(blob) });
        stream.current?.getTracks().forEach((t) => t.stop());
      };
      r.start(); rec.current = r; setState("recording");
    } catch { setError("Could not use the microphone. Allow microphone access in your browser and try again."); }
  };
  const stop = () => { rec.current?.stop(); setState("idle"); };
  const pause = () => { if (state === "recording") { rec.current?.pause(); setState("paused"); } else { rec.current?.resume(); setState("recording"); } };

  const ext = clip?.blob.type.includes("ogg") ? "ogg" : clip?.blob.type.includes("mp4") ? "m4a" : "webm";
  const toMp3 = async () => {
    if (!clip) return;
    setConverting(true); setError("");
    try {
      const blob = await runFFmpeg(new File([clip.blob], `recording.${ext}`), (i) => ["-i", i, "-vn", "-c:a", "libmp3lame", "-b:a", "192k", "recording.mp3"], "recording.mp3", "audio/mpeg");
      download(blob, "recording.mp3");
    } catch { setError("Could not convert to MP3. Download the original recording instead."); }
    setConverting(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-6 text-center">
        <p className="font-mono text-4xl font-bold tabular-nums" role="timer" aria-label="Recording time">{clock(secs)}</p>
        <p className="mt-1 text-sm text-neutral-500" role="status">{state === "recording" ? "Recording…" : state === "paused" ? "Paused" : clip ? "Recording saved below" : "Ready"}</p>
        <div className="mt-4 flex justify-center gap-3">
          {state === "idle" && <button className="btn" onClick={start}><Mic className="h-4 w-4" /> {clip ? "Record again" : "Start recording"}</button>}
          {state !== "idle" && <>
            <button className="btn-ghost" onClick={pause}>{state === "paused" ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}</button>
            <button className="btn" onClick={stop}><Square className="h-4 w-4" /> Stop</button>
          </>}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {clip && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <audio src={clip.url} controls className="w-full" />
          <p className="text-sm">{formatBytes(clip.blob.size)} · {clock(secs)}</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={() => download(clip.blob, `recording.${ext}`)}>Download .{ext}</button>
            <button className="btn-ghost" disabled={converting} onClick={toMp3}>{converting ? "Converting…" : "Download as MP3"}</button>
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-500">Your recording stays on your device. Nothing is uploaded.</p>
    </div>
  );
}
