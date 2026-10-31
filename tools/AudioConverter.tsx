"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

const formats = [
  { id: "mp3", label: "MP3", mime: "audio/mpeg", lossy: true, codec: ["-c:a", "libmp3lame"] },
  { id: "m4a", label: "M4A (AAC)", mime: "audio/mp4", lossy: true, codec: ["-c:a", "aac"] },
  { id: "wav", label: "WAV", mime: "audio/wav", lossy: false, codec: ["-c:a", "pcm_s16le"] },
  { id: "flac", label: "FLAC", mime: "audio/flac", lossy: false, codec: ["-c:a", "flac"] },
] as const;

export default function AudioConverter() {
  const [fmt, setFmt] = useState<(typeof formats)[number]>(formats[0]);
  const [kbps, setKbps] = useState(192);
  return (
    <VideoRunner
      media="audio" accept="audio/*,video/*,.m4a,.aac,.flac,.ogg,.opus,.wma" result="audio" cta={`Convert to ${fmt.label}`}
      outName={`converted.${fmt.id}`} mime={fmt.mime}
      args={(i) => ["-i", i, "-vn", ...fmt.codec, ...(fmt.lossy ? ["-b:a", `${kbps}k`] : []), `converted.${fmt.id}`]}
      controls={() => (
        <div className="space-y-3">
          <div><label className="label">Convert to</label>
            <div className="flex flex-wrap gap-2">{formats.map((f) => <button key={f.id} className={f.id === fmt.id ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setFmt(f)}>{f.label}</button>)}</div></div>
          {fmt.lossy && <div><label className="label">Quality</label>
            <div className="flex gap-2">{[128, 192, 256, 320].map((k) => <button key={k} className={k === kbps ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => setKbps(k)}>{k} kbps</button>)}</div></div>}
        </div>
      )}
    />
  );
}
