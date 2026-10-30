"use client";
import { useState } from "react";
import VideoRunner from "@/components/VideoRunner";

export default function VideoToGif() {
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(4);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  return (
    <VideoRunner
      outName="video.gif" mime="image/gif" result="image" cta="Create GIF"
      args={(i) => ["-ss", String(start), "-t", String(len), "-i", i, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, "-loop", "0", "video.gif"]}
      controls={({ video }) => (
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start (sec)</label><input type="number" min={0} step={0.1} className="input" value={start} onChange={(e) => setStart(Math.max(0, +e.target.value))} />
            <button className="mt-1 text-xs text-brand-600 underline" onClick={() => video && setStart(+video.currentTime.toFixed(1))}>Use current position</button></div>
          <div><label className="label">Length (sec, max 15)</label><input type="number" min={0.5} max={15} step={0.5} className="input" value={len} onChange={(e) => setLen(Math.min(15, Math.max(0.5, +e.target.value || 1)))} /></div>
          <div><label className="label">Frames per second</label><select className="input" value={fps} onChange={(e) => setFps(+e.target.value)}>{[8, 10, 12, 15, 20].map((f) => <option key={f}>{f}</option>)}</select></div>
          <div><label className="label">Width (px)</label><select className="input" value={width} onChange={(e) => setWidth(+e.target.value)}>{[240, 320, 480, 640].map((w) => <option key={w}>{w}</option>)}</select></div>
        </div>
      )}
    />
  );
}
