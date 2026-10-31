"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

const ext = (f: File) => f.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "mp3";

export default function AudioTrimmer() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  return (
    <VideoRunner
      media="audio" accept="audio/*,.m4a,.aac,.flac,.ogg,.opus" result="audio" cta="Trim audio"
      outName={(f) => `trimmed.${ext(f)}`} mime={(f) => f.type || "audio/mpeg"}
      args={(i, f) => ["-ss", String(start), "-to", String(end), "-i", i, "-vn", "-c", "copy", `trimmed.${ext(f)}`]}
      controls={({ video, duration }) => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start (sec)</label><input type="number" min={0} step={0.1} className="input" aria-label="Start" value={start} onChange={(e) => setStart(Math.max(0, +e.target.value))} />
              <button className="mt-1 text-xs text-brand-600 underline" onClick={() => video && setStart(+video.currentTime.toFixed(1))}>Use current position</button></div>
            <div><label className="label">End (sec)</label><input type="number" min={0} step={0.1} className="input" aria-label="End" value={duration && end > duration ? +duration.toFixed(1) : end} onChange={(e) => setEnd(Math.max(0, +e.target.value))} />
              <button className="mt-1 text-xs text-brand-600 underline" onClick={() => video && setEnd(+video.currentTime.toFixed(1))}>Use current position</button></div>
          </div>
          {end <= start && <p className="text-sm text-red-600">End must be after start.</p>}
        </div>
      )}
    />
  );
}
