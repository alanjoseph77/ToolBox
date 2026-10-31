"use client";
import VideoRunner from "@/components/VideoRunner";

const ext = (f: File) => f.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "mp4";

export default function MuteVideo() {
  return (
    <VideoRunner
      outName={(f) => `muted.${ext(f)}`} mime={(f) => f.type || "video/mp4"} cta="Remove sound"
      args={(i, f) => ["-i", i, "-an", "-c:v", "copy", `muted.${ext(f)}`]}
      controls={() => <p className="text-sm text-neutral-600">The sound is removed and the picture is copied as it is, so it is fast and the video quality does not change.</p>}
    />
  );
}
