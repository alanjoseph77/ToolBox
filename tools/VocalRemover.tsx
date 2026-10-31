"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import VideoRunner from "@/components/VideoRunner";

export default function VocalRemover() {
  const [bass, setBass] = useState(true);
  // Vocals sit in the centre of most stereo songs, so subtracting one channel from the other cancels them.
  // The bass is kept out of the cancelling because it is centred too.
  const cancel = "pan=stereo|c0=c0-c1|c1=c1-c0";
  const graph = bass
    ? `[0:a]aformat=channel_layouts=stereo,asplit=2[a][b];[a]lowpass=f=150,lowpass=f=150[low];[b]highpass=f=150,${cancel}[hi];[low][hi]amix=inputs=2:weights=1 1,volume=2`
    : `[0:a]aformat=channel_layouts=stereo,${cancel},volume=1.5`;
  return (
    <VideoRunner
      media="audio" accept="audio/*,video/*,.m4a,.aac,.flac,.ogg,.opus" result="audio" cta="Remove vocals"
      outName="no-vocals.mp3" mime="audio/mpeg"
      args={(i) => ["-i", i, "-vn", "-filter_complex", graph, "-c:a", "libmp3lame", "-b:a", "192k", "no-vocals.mp3"]}
      controls={() => (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bass} onChange={(e) => setBass(e.target.checked)} /> Keep the bass and kick drum</label>
          <p className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> This removes sound that sits in the centre of a stereo song, which is where most lead vocals are. It is not AI, so some of the voice or effects may remain, and other centred sounds may get quieter. Mono recordings come out silent.</p>
        </div>
      )}
    />
  );
}
