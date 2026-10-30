"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

const targets = [
  { ext: "mp4", label: "MP4", mime: "video/mp4", args: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-c:a", "aac", "-movflags", "+faststart"] },
  { ext: "webm", label: "WebM", mime: "video/webm", args: ["-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis"] },
  { ext: "mkv", label: "MKV", mime: "video/x-matroska", args: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-c:a", "aac"] },
];

export default function VideoConverter() {
  const [t, setT] = useState(targets[0]);
  return (
    <VideoRunner
      outName={`converted.${t.ext}`} mime={t.mime} cta={`Convert to ${t.label}`}
      args={(i) => ["-i", i, ...t.args, `converted.${t.ext}`]}
      controls={() => <div><label className="label">Convert to</label><div className="flex gap-2">{targets.map((x) => <button key={x.ext} className={x === t ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setT(x)}>{x.label}</button>)}</div></div>}
    />
  );
}
