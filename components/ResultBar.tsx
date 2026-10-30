"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link2, X } from "lucide-react";
import { clearLastResult, getLastResult, handOff, nextTools, subscribe } from "@/lib/handoff";
import { formatBytes } from "@/lib/files";
import { tools } from "@/lib/tools";

/** After a download, offers the next tool with the file already loaded (no re-upload). */
export default function ResultBar() {
  const result = useSyncExternalStore(subscribe, getLastResult, () => null);
  const router = useRouter();
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [result]);
  if (!result || hidden) return null;

  const current = path.replace(/^\//, "");
  const options = nextTools[result.kind].filter((s) => s !== current).map((s) => tools.find((t) => t.slug === s)).filter(Boolean).slice(0, 6) as typeof tools;
  if (!options.length) return null;

  return (
    <div role="region" aria-label="Continue with another tool" className="card fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl animate-pop space-y-2 p-3 shadow-glow sm:bottom-5">
      <div className="flex items-center gap-2 text-sm">
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate"><b>{result.name}</b> <span className="text-neutral-500">({formatBytes(result.blob.size)})</span> is ready. Keep going:</span>
        <button aria-label="Dismiss" onClick={() => { setHidden(true); clearLastResult(); }} className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {options.map((t) => (
          <button key={t.slug} className="chip shrink-0" onClick={() => { handOff(result, t.slug); clearLastResult(); router.push(`/${t.slug}`); }}>{t.name}</button>
        ))}
      </div>
    </div>
  );
}
