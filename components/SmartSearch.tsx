"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { searchTools } from "@/lib/search";
import { categoryStyle } from "@/lib/icons";
import { tools } from "@/lib/tools";
import ToolIcon from "./ToolIcon";

const TRY = ["remove bg", "compress pdf", "photo under 50 kb", "pdf to word", "song from video", "menu qr"];

/** The big home-page search: results open as you type, best match first, with a preview on wide screens. */
export default function SmartSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { hits, corrected } = useMemo(() => searchTools(q, 8), [q]);
  const active = hits[idx]?.tool;

  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const go = (slug: string) => { setOpen(false); router.push(`/${slug}`); };
  const pick = (s: string) => { setQ(s); setOpen(true); input.current?.focus(); };
  const showing = open && q.trim().length > 0;

  return (
    <div ref={box} className="relative mx-auto max-w-2xl text-left">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Try “remove bg” or “pdf to word”" aria-label="Search tools" role="combobox" aria-expanded={showing} aria-controls={listId}
          aria-activedescendant={showing && active ? `${listId}-${idx}` : undefined} autoComplete="off" enterKeyHint="go" data-testid="smart-search"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setIdx((i) => Math.min(i + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && active) { e.preventDefault(); go(active.slug); }
            else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
          }}
          className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pl-12 pr-12 text-base shadow-soft transition placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-white/10" />
        {q && <button onClick={() => { setQ(""); input.current?.focus(); }} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>}
      </div>


      {showing && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-pop dark:border-neutral-800 dark:bg-black" data-testid="search-results">
          {hits.length ? (
            <div className="grid lg:grid-cols-[1.3fr_1fr]">
              <ul id={listId} role="listbox" aria-label="Matching tools" className="max-h-[60vh] overflow-y-auto py-2 lg:max-h-none">
                {corrected && <li className="px-4 pb-1 pt-1 text-xs text-neutral-500" data-testid="did-you-mean">Showing results for <b className="text-neutral-900 dark:text-white">{corrected}</b></li>}
                {hits.map(({ tool: t }, i) => (
                  <li key={t.slug} role="presentation">
                    {i === 0 && <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Best match</p>}
                    {i === 1 && <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Also helps</p>}
                    <Link href={`/${t.slug}`} id={`${listId}-${i}`} role="option" aria-selected={i === idx} onMouseEnter={() => setIdx(i)} onClick={() => setOpen(false)}
                      className={`flex min-h-[56px] items-center gap-3 px-4 py-2 ${i === idx ? "bg-neutral-100 dark:bg-neutral-900" : ""}`}>
                      <ToolIcon tool={t} />
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{t.name}</span><span className="block truncate text-xs text-neutral-500">{t.description}</span></span>
                      {i === idx && <span className="hidden items-center gap-1 rounded-md border border-neutral-300 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-500 sm:flex dark:border-neutral-700"><CornerDownLeft className="h-3 w-3" /> Open</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {active && (
                <div className="hidden border-l border-neutral-100 bg-neutral-50 p-5 lg:block dark:border-neutral-800 dark:bg-neutral-950" data-testid="search-preview">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Preview</p>
                  <div className="mt-3 flex items-center gap-3"><ToolIcon tool={active} size="lg" /><div><p className="text-lg font-bold leading-tight">{active.name}</p><p className={`text-xs font-semibold ${categoryStyle[active.category].text}`}>{categoryStyle[active.category].label}</p></div></div>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{active.description}</p>
                  <p className="mt-2 text-xs text-neutral-500">Free · no sign-up · works on your device</p>
                  <button onClick={() => go(active.slug)} className="btn mt-4">Open tool <ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center" data-testid="no-results">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">No tool found for “{q}”.</p>
              <p className="mt-1 text-xs text-neutral-500">Try one of these, or <Link href="#finder" onClick={() => setOpen(false)} className="font-semibold underline">answer two quick questions</Link>.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">{TRY.slice(0, 4).map((s) => <button key={s} onClick={() => pick(s)} className="chip !py-1 text-xs">{s}</button>)}</div>
            </div>
          )}
          <div className="hidden border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400 sm:flex sm:justify-between dark:border-neutral-800"><span>↑ ↓ to move · Enter to open · Esc to close</span><span>{tools.length} tools</span></div>
        </div>
      )}
    </div>
  );
}
