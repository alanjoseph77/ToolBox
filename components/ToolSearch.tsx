"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { tools } from "@/lib/tools";
import ToolCard from "./ToolCard";

export default function ToolSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? tools.filter((t) => [t.name, t.description, ...t.keywords].join(" ").toLowerCase().includes(s)) : [];
  }, [q]);
  const suggestions = ["Compress PDF", "Remove background", "Passport photo", "Video to MP3", "QR code"];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to do today?" aria-label="Search tools"
          className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pl-12 pr-12 text-base shadow-soft transition placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-white/10" />
        {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>}
      </div>
      {!q.trim() && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => <button key={s} onClick={() => setQ(s)} className="chip !py-1 text-xs">{s}</button>)}
        </div>
      )}
      {q.trim() && (
        <div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
          {results.length ? results.map((t) => <ToolCard key={t.slug} tool={t} />) : <p className="col-span-full py-6 text-center text-sm text-neutral-500">No tool found for “{q}”. Try “pdf”, “image” or “video”.</p>}
        </div>
      )}
    </div>
  );
}
