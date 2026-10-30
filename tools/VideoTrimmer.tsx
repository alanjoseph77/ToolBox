"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

export default function VideoTrimmer() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [precise, setPrecise] = useState(false);
  const ext = (f: File) => f.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "mp4";
  return (
    <VideoRunner
      outName={(f) => `trimmed.${ext(f)}`} mime={(f) => f.type || "video/mp4"} cta="Trim video"
      args={(i, f) => ["-ss", String(start), "-to", String(end), "-i", i, ...(precise ? ["-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac"] : ["-c", "copy"]), `trimmed.${ext(f)}`]}
      controls={({ video, duration }) => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start (sec)</label><input type="number" min={0} step={0.1} className="input" value={start} onChange={(e) => setStart(Math.max(0, +e.target.value))} />
              <button className="mt-1 text-xs text-brand-600 underline" onClick={() => video && setStart(+video.currentTime.toFixed(1))}>Use current position</button></div>
            <div><label className="label">End (sec)</label><input type="number" min={0} step={0.1} className="input" value={duration && end > duration ? +duration.toFixed(1) : end} onChange={(e) => setEnd(Math.max(0, +e.target.value))} />
              <button className="mt-1 text-xs text-brand-600 underline" onClick={() => video && setEnd(+video.currentTime.toFixed(1))}>Use current position</button></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={precise} onChange={(e) => setPrecise(e.target.checked)} /> Frame-accurate (slower, re-encodes)</label>
          {end <= start && <p className="text-sm text-red-600">End must be after start.</p>}
        </div>
      )}
    />
  );
}
