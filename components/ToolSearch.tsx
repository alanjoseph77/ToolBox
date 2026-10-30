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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to do today?" aria-label="Search tools"
          className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-12 text-base shadow-soft transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-800/40" />
        {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}
      </div>
      {!q.trim() && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => <button key={s} onClick={() => setQ(s)} className="chip !py-1 text-xs">{s}</button>)}
        </div>
      )}
      {q.trim() && (
        <div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
          {results.length ? results.map((t) => <ToolCard key={t.slug} tool={t} />) : <p className="col-span-full py-6 text-center text-sm text-slate-500">No tool found for “{q}”. Try “pdf”, “image” or “video”.</p>}
        </div>
      )}
    </div>
  );
}
