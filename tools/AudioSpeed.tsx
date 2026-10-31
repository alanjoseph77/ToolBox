"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

export default function AudioSpeed() {
  const [rate, setRate] = useState(1.25);
  return (
    <VideoRunner
      media="audio" accept="audio/*,.m4a,.aac,.flac,.ogg,.opus" result="audio" cta={`Change speed to ${rate}×`}
      outName="speed.mp3" mime="audio/mpeg"
      args={(i) => ["-i", i, "-vn", "-filter:a", `atempo=${rate}`, "-c:a", "libmp3lame", "-b:a", "192k", "speed.mp3"]}
      controls={() => (
        <div className="space-y-2">
          <label className="label" htmlFor="speed">Speed: {rate}×</label>
          <input id="speed" aria-label="Speed" type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full" />
          <div className="flex flex-wrap gap-2">{[0.75, 1, 1.25, 1.5, 2].map((r) => <button key={r} className={r === rate ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setRate(r)}>{r}×</button>)}</div>
          <p className="text-xs text-neutral-500">The pitch stays the same, so voices do not sound squeaky or deep.</p>
        </div>
      )}
    />
  );
}
