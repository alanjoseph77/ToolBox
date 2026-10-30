"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

const levels = [{ label: "Balanced", crf: "28" }, { label: "Smaller", crf: "32" }, { label: "Smallest", crf: "36" }];
const heights = [{ label: "Keep size", h: 0 }, { label: "720p", h: 720 }, { label: "480p", h: 480 }, { label: "360p", h: 360 }];

export default function VideoCompressor() {
  const [level, setLevel] = useState(levels[0]);
  const [height, setHeight] = useState(heights[1]);
  return (
    <VideoRunner
      outName="compressed.mp4" mime="video/mp4" cta="Compress video"
      args={(i) => ["-i", i, ...(height.h ? ["-vf", `scale=-2:min(ih\\,${height.h})`] : []), "-c:v", "libx264", "-crf", level.crf, "-preset", "veryfast", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "compressed.mp4"]}
      controls={() => (
        <div className="space-y-3">
          <div><label className="label">Compression</label><div className="flex gap-2">{levels.map((l) => <button key={l.label} className={l === level ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setLevel(l)}>{l.label}</button>)}</div></div>
          <div><label className="label">Resolution</label><div className="flex flex-wrap gap-2">{heights.map((h) => <button key={h.label} className={h === height ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setHeight(h)}>{h.label}</button>)}</div></div>
        </div>
      )}
    />
  );
}
