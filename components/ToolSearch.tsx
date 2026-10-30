"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { tools } from "@/lib/tools";
import ToolCard from "./ToolCard";

export default function ToolSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return tools.filter((t) => [t.name, t.description, ...t.keywords].join(" ").toLowerCase().includes(s));
  }, [q]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to do today?"
          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100" />
      </div>
      {q.trim() && (
        <div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
          {results.length ? results.map((t) => <ToolCard key={t.slug} tool={t} />) : <p className="text-sm text-slate-500">No tool found for “{q}”.</p>}
        </div>
      )}
    </div>
  );
}
