"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import ToolFinder from "./ToolFinder";
import { usePasteTarget } from "./PasteButton";

/** One small card on the home page; it opens the two-question finder. Pasting a picture on the home page opens it too. */
export default function FinderCard() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const card = useRef<HTMLButtonElement>(null);
  usePasteTarget(card, (f) => { setFile(f[0] ?? null); setOpen(true); }, !open);
  useEffect(() => {
    const check = () => { if (location.hash === "#finder") setOpen(true); };
    check(); window.addEventListener("hashchange", check); return () => window.removeEventListener("hashchange", check);
  }, []);
  if (open) return <div className="mt-10" id="finder-wrap"><ToolFinder initialFile={file} /></div>;
  return (
    <button ref={card} onClick={() => setOpen(true)} id="finder" data-testid="finder-open"
      className="mx-auto mt-8 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-4 text-left transition hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-white">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black"><Sparkles className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1"><span className="block font-bold">Not sure which tool?</span><span className="block text-sm text-neutral-500">Answer 2 quick questions, or choose your file</span></span>
      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
    </button>
  );
}
