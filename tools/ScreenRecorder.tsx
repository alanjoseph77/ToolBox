"use client";
import { useEffect, useRef, useState } from "react";
import { download, formatBytes } from "@/lib/files";

export default function ScreenRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const streams = useRef<MediaStream[]>([]);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const [mic, setMic] = useState(false);
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const [out, setOut] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState("");
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
  useEffect(() => () => { clearInterval(timer.current); streams.current.forEach((s) => s.getTracks().forEach((t) => t.stop())); }, []);

  const start = async () => {
    setError(""); setOut(null);
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }), all = [screen];
      const tracks = [...screen.getVideoTracks(), ...screen.getAudioTracks()];
      if (mic) { try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); all.push(m); tracks.push(...m.getAudioTracks()); } catch { setError("Microphone was not allowed. Recording the screen without it."); } }
      streams.current = all;
      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime } : undefined); chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        clearInterval(timer.current); all.forEach((s) => s.getTracks().forEach((t) => t.stop()));
        const blob = new Blob(chunks.current, { type: r.mimeType || "video/webm" }); setOut({ blob, url: URL.createObjectURL(blob) }); setState("done");
      };
      screen.getVideoTracks()[0].onended = () => r.state !== "inactive" && r.stop();      // the browser's own "Stop sharing" button
      r.start(1000); rec.current = r; setSecs(0); setState("recording"); timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch (e) { setError((e as Error).name === "NotAllowedError" ? "Screen sharing was cancelled." : "Could not start recording in this browser."); setState("idle"); }
  };
  const stop = () => rec.current?.state !== "inactive" && rec.current?.stop();
  const ext = out?.blob.type.includes("mp4") ? "mp4" : "webm";
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {!supported && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">Screen recording needs a desktop browser such as Chrome, Edge or Firefox. Phones do not allow it from a web page. Use your phone&apos;s built-in screen recorder instead.</p>}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={mic} disabled={state === "recording"} onChange={(e) => setMic(e.target.checked)} /> Also record my microphone</label>
        {state !== "recording"
          ? <button className="btn w-full" disabled={!supported} onClick={start}>Start recording</button>
          : <button className="btn w-full !bg-red-600" onClick={stop} data-testid="stop">Stop ({mmss})</button>}
        <p className="text-xs text-neutral-500">You choose what to share (a screen, a window or a tab). Tick &quot;share audio&quot; in the browser to capture sound from a tab. Nothing is uploaded.</p>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {out && (
        <div className="space-y-3">
          <video src={out.url} controls className="w-full rounded-xl border bg-black" data-testid="rec-video" />
          <p className="text-sm text-neutral-600" data-testid="rec-info">{formatBytes(out.blob.size)} · {ext.toUpperCase()}</p>
          <button className="btn w-full" onClick={() => download(out.blob, `screen-recording.${ext}`, out.blob.type)}>Download {ext.toUpperCase()}</button>
          <p className="text-xs text-neutral-500">Need MP4? Open the file in the Video Converter tool.</p>
        </div>
      )}
    </div>
  );
}
