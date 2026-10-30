"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

export default function VideoToMp3() {
  const [kbps, setKbps] = useState(192);
  return (
    <VideoRunner
      accept="video/*,audio/*" outName="audio.mp3" mime="audio/mpeg" result="audio" cta="Extract MP3"
      args={(i) => ["-i", i, "-vn", "-c:a", "libmp3lame", "-b:a", `${kbps}k`, "audio.mp3"]}
      controls={() => <div><label className="label">Quality</label><div className="flex gap-2">{[128, 192, 256, 320].map((k) => <button key={k} className={k === kbps ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setKbps(k)}>{k} kbps</button>)}</div></div>}
    />
  );
}
