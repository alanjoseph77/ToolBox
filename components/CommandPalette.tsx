"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { tools } from "@/lib/tools";
import ToolIcon from "./ToolIcon";

/** Header search button + Ctrl/Cmd+K quick finder. */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? tools.filter((t) => [t.name, t.description, ...t.keywords].join(" ").toLowerCase().includes(s)) : tools.filter((t) => t.popular);
    return list.slice(0, 8);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);
  useEffect(() => setIdx(0), [q]);

  const go = (slug: string) => { setOpen(false); router.push(`/${slug}`); };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Search tools" className="btn-ghost !min-h-0 !justify-between gap-6 !rounded-full !py-2 !pl-3 !pr-2 text-neutral-500 sm:!min-w-[220px]">
        <span className="flex items-center gap-2"><Search className="h-4 w-4" /><span className="hidden sm:inline">Search tools</span></span>
        <kbd className="hidden rounded-md border border-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold sm:inline dark:border-neutral-600">Ctrl K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Search tools">
          <div className="card w-full max-w-xl animate-pop overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b px-4 dark:border-neutral-700">
              <Search className="h-5 w-5 text-neutral-400" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 47 tools…"
                className="h-14 flex-1 bg-transparent text-base outline-none ring-0 placeholder:text-neutral-400 focus-visible:!ring-0 focus-visible:!ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter" && results[idx]) go(results[idx].slug);
                }} />
            </div>
            <ul className="max-h-[50vh] overflow-auto p-2">
              {!q.trim() && <li className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Popular</li>}
              {results.map((t, i) => (
                <li key={t.slug}>
                  <button onMouseEnter={() => setIdx(i)} onClick={() => go(t.slug)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === idx ? "bg-neutral-100 dark:bg-neutral-900" : ""}`}>
                    <ToolIcon tool={t} />
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{t.name}</span><span className="block truncate text-xs text-neutral-500">{t.description}</span></span>
                    {i === idx && <CornerDownLeft className="h-4 w-4 text-neutral-400" />}
                  </button>
                </li>
              ))}
              {!results.length && <li className="px-3 py-8 text-center text-sm text-neutral-500">No tool found for “{q}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
