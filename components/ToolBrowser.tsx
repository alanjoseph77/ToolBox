"use client";
import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { categories, tools, type Category } from "@/lib/tools";
import { categoryStyle } from "@/lib/icons";
import { clearRecent, getRecent } from "@/lib/recent";
import ToolCard from "./ToolCard";

export default function ToolBrowser() {
  const [active, setActive] = useState<Category | "All">("All");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(getRecent()), []);
  const recentTools = recent.map((s) => tools.find((t) => t.slug === s)).filter(Boolean) as typeof tools;
  const shown = categories.filter((c) => active === "All" || c === active);

  return (
    <div className="space-y-12">
      {recentTools.length > 0 && (
        <section aria-labelledby="recent">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent" className="flex items-center gap-2 text-xl font-bold"><Clock className="h-5 w-5 text-neutral-400" /> Recently used</h2>
            <button onClick={() => { clearRecent(); setRecent([]); }} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"><X className="h-3 w-3" /> Clear</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{recentTools.slice(0, 4).map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        </section>
      )}

      <section aria-labelledby="popular">
        <h2 id="popular" className="mb-3 text-xl font-bold">Popular tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tools.filter((t) => t.popular).map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
      </section>

      <section aria-labelledby="all">
        <h2 id="all" className="mb-3 text-xl font-bold">All tools <span className="text-base font-medium text-neutral-400">({tools.length})</span></h2>
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Tool categories">
          {(["All", ...categories] as const).map((c) => (
            <button key={c} role="tab" aria-selected={active === c} onClick={() => setActive(c)} className={`chip shrink-0 ${active === c ? "chip-active" : ""}`}>
              {c !== "All" && <span className={`h-2 w-2 rounded-full ${categoryStyle[c].dot}`} />}
              {c === "All" ? "All" : c}
              <span className="text-xs opacity-70">{c === "All" ? tools.length : tools.filter((t) => t.category === c).length}</span>
            </button>
          ))}
        </div>
        <div className="space-y-10">
          {shown.map((c) => (
            <div key={c} id={c.toLowerCase()} className="scroll-mt-24">
              <h3 className={`mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${categoryStyle[c].text}`}><span className={`h-2 w-2 rounded-full ${categoryStyle[c].dot}`} />{categoryStyle[c].label}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tools.filter((t) => t.category === c).map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
