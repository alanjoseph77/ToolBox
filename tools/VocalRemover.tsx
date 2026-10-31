"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import VideoRunner from "@/components/VideoRunner";

export default function VocalRemover() {
  const [bass, setBass] = useState(true);
  // Vocals sit in the centre of most stereo songs, so subtracting one channel from the other cancels them.
  // The bass is kept out of the cancelling because it is centred too.
  const [keepVideo, setKeepVideo] = useState(true);
  const cancel = "pan=stereo|c0=c0-c1|c1=c1-c0";
  // The same graph either way; the output pad is named so a video can be paired with it.
  const graph = (bass
    ? `[0:a]aformat=channel_layouts=stereo,asplit=2[a][b];[a]lowpass=f=150,lowpass=f=150[low];[b]highpass=f=150,${cancel}[hi];[low][hi]amix=inputs=2:weights=1 1,volume=2`
    : `[0:a]aformat=channel_layouts=stereo,${cancel},volume=1.5`) + "[out]";
  const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mp4|mov|m4v|mkv|webm)$/i.test(f.name);
  const ext = (f: File) => f.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "mp4";
  const asVideo = (f: File) => keepVideo && isVideo(f);
  return (
    <VideoRunner
      media="auto" accept="audio/*,video/*,.m4a,.aac,.flac,.ogg,.opus" result={(f) => (asVideo(f) ? "video" : "audio")} cta="Remove vocals"
      outName={(f) => (asVideo(f) ? `no-vocals.${ext(f)}` : "no-vocals.mp3")} mime={(f) => (asVideo(f) ? f.type || "video/mp4" : "audio/mpeg")}
      args={(i, f) => asVideo(f)
        ? ["-i", i, "-filter_complex", graph, "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", ext(f) === "webm" ? "libvorbis" : "aac", "-b:a", "192k", `no-vocals.${ext(f)}`]
        : ["-i", i, "-vn", "-filter_complex", graph, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", "no-vocals.mp3"]}
      controls={() => (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bass} onChange={(e) => setBass(e.target.checked)} /> Keep the bass and kick drum</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepVideo} onChange={(e) => setKeepVideo(e.target.checked)} /> If I add a video, keep the picture (save a video, not just audio)</label>
          <p className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> This removes sound that sits in the centre of a stereo mix, which is where most lead vocals are. It works best on music videos. It is not AI, so some of the voice may remain. Videos with speech or mono sound come out silent or unchanged in odd ways, because that kind of audio is not a stereo mix.</p>
        </div>
      )}
    />
  );
}
