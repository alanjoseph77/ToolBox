"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

export default function AudioCompressor() {
  const [kbps, setKbps] = useState(96);
  const [mono, setMono] = useState(false);
  return (
    <VideoRunner
      media="audio" accept="audio/*,video/*,.m4a,.aac,.flac,.ogg,.opus" result="audio" cta="Compress audio"
      outName="compressed.mp3" mime="audio/mpeg"
      args={(i) => ["-i", i, "-vn", "-ac", mono ? "1" : "2", "-c:a", "libmp3lame", "-b:a", `${kbps}k`, "compressed.mp3"]}
      controls={() => (
        <div className="space-y-3">
          <div><label className="label">Quality (lower is smaller)</label>
            <div className="flex flex-wrap gap-2">{[48, 64, 96, 128, 160].map((k) => <button key={k} className={k === kbps ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setKbps(k)}>{k} kbps</button>)}</div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} /> Mono (smaller, fine for voice)</label>
        </div>
      )}
    />
  );
}
