"use client";
import { useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { canvasToBlob, download } from "@/lib/files";

export default function VideoThumbnail() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState("");
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [shots, setShots] = useState<{ url: string; blob: Blob; t: number }[]>([]);

  const grab = async (t?: number): Promise<{ url: string; blob: Blob; t: number }> => {
    const v = videoRef.current!;
    if (t !== undefined) { v.currentTime = t; await new Promise((r) => v.addEventListener("seeked", r, { once: true })); }
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob = await canvasToBlob(c, "image/jpeg", 0.92);
    return { url: URL.createObjectURL(blob), blob, t: v.currentTime };
  };

  const auto = async () => { const out = []; for (let i = 1; i <= 6; i++) out.push(await grab((duration * i) / 7)); setShots(out); };

  return (
    <div className="space-y-4">
      <Dropzone accept="video/*" onFiles={(f) => { if (f[0]) { setSrc(URL.createObjectURL(f[0])); setShots([]); } }} hint="Pick a video, scrub to a frame, and save it as a JPG." />
      {src && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} src={src} className="max-h-72 w-full rounded bg-black" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} controls onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
          <input type="range" min={0} max={duration || 1} step={0.05} value={time} className="w-full" onChange={(e) => { const t = +e.target.value; setTime(t); if (videoRef.current) videoRef.current.currentTime = t; }} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={async () => { const s = await grab(); setShots((p) => [s, ...p]); }}>Capture this frame</button>
            <button className="btn-ghost" onClick={auto}>Auto-pick 6 frames</button>
          </div>
          {shots.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shots.map((s, i) => (
                <div key={i} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={`Frame at ${s.t.toFixed(1)}s`} className="rounded border" />
                  <button className="btn-ghost w-full !py-1 !text-xs" onClick={() => download(s.blob, `thumbnail-${s.t.toFixed(1)}s.jpg`)}>Download ({s.t.toFixed(1)}s)</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
