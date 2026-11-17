"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, AudioLines, ChevronRight, FileText, Image as ImageIcon, Sparkles, Type, Upload, Video, Wrench, X, type LucideIcon } from "lucide-react";
import { HAVES, haveOf, type HaveId } from "@/lib/finder";
import { toolIcons } from "@/lib/icons";
import { handOffFile } from "@/lib/handoff";
import PasteButton, { usePasteTarget } from "./PasteButton";

const ICON: Record<HaveId, LucideIcon> = { pdf: FileText, photo: ImageIcon, video: Video, audio: AudioLines, text: Type, none: Sparkles };
const kb = (n: number) => n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** Home page: "What do you have?" then "What do you want to do?". Side by side on wide screens, one after the other on phones. */
export default function ToolFinder() {
  const router = useRouter();
  const [have, setHave] = useState<HaveId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [note, setNote] = useState("");
  const top = useRef<HTMLElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const dropBox = useRef<HTMLLabelElement>(null);
  const h = HAVES.find((x) => x.id === have);
  const [thumb, setThumb] = useState("");
  useEffect(() => { if (!file?.type.startsWith("image/")) { setThumb(""); return; } const u = URL.createObjectURL(file); setThumb(u); return () => URL.revokeObjectURL(u); }, [file]);

  const choose = (id: HaveId | null, keepFile = false) => {
    setHave(id); setNote(""); if (!keepFile) setFile(null);
    // On phones step 2 replaces step 1, so bring the top of the box into view.
    if (window.innerWidth < 1024) requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  };
  const takeFile = (f: File | undefined) => {
    if (!f) return;
    const id = haveOf(f);
    if (!id) { setNote(`ToolBox has no tools for “${f.name}” yet. Pick what kind of file it is above.`); return; }
    setFile(f); choose(id, true);
  };
  usePasteTarget(dropBox, (f) => takeFile(f[0]));
  const open = (slug: string) => { if (file) handOffFile(file, slug); router.push(`/${slug}`); };

  const step1 = (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Step 1</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">What do you have?</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="What do you have?">
        {HAVES.map((x) => {
          const Icon = ICON[x.id], on = have === x.id;
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => choose(on ? null : x.id)} data-testid={`have-${x.id}`}
              className={`flex min-h-[112px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[.98] ${on ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-neutral-200 bg-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-black dark:hover:border-white"}`}>
              <Icon className="h-6 w-6" aria-hidden />
              <span><span className="block font-bold">{x.label}</span><span className={`block text-xs ${on ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500"}`}>{x.sub}</span></span>
            </button>
          );
        })}
      </div>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-neutral-400 before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200 dark:before:bg-neutral-800 dark:after:bg-neutral-800">or</div>
      <label ref={dropBox} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files[0]); }}
        className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition ${drag ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900" : "border-neutral-300 hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-white"}`}>
        <span className="flex items-center gap-2 font-bold"><Upload className="h-4 w-4" aria-hidden /> Choose or drop a file</span>
        <span className="mt-1 text-xs text-neutral-500">We show what you can do with it. It stays on your device.<span className="hidden sm:inline"> You can also paste a copied picture (Ctrl+V).</span></span>
        <span className="mt-3"><PasteButton small label="Paste a copied image" onFiles={(f) => takeFile(f[0])} /></span>
        <input ref={pickRef} type="file" className="sr-only" data-testid="finder-file" onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {note && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300" role="status">{note}</p>}
    </div>
  );

  const step2 = h ? (
    <div data-testid="finder-step2">
      <button onClick={() => choose(null)} className="-ml-2 mb-2 flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 lg:hidden dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button>
      <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Step 2
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-xs font-bold normal-case tracking-normal text-neutral-900 dark:border-neutral-800 dark:bg-black dark:text-white">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black">{(() => { const I = ICON[h.id]; return <I className="h-3 w-3" />; })()}</span>{h.label}</span>
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">What do you want to do?</h2>
      {file && (
        <p className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-900" data-testid="finder-filename">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="Your picture" data-testid="finder-thumb" className="h-12 w-12 shrink-0 rounded-lg border border-white object-cover dark:border-black" />}
          <span className="min-w-0 flex-1 truncate"><b>{file.name}</b> <span className="text-neutral-500">· {kb(file.size)} · opens in the tool you pick</span></span>
          <button onClick={() => setFile(null)} aria-label="Forget this file" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
        </p>
      )}
      <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
        {h.actions.map((a) => {
          const Icon = toolIcons[a.slug] ?? Wrench;
          return (
            <li key={a.slug}>
              <button onClick={() => open(a.slug)} data-testid={`act-${a.slug}`}
                className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left transition hover:border-neutral-900 active:scale-[.99] dark:border-neutral-800 dark:bg-black dark:hover:border-white">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block font-semibold leading-snug">{a.label}{a.popular && <span className="ml-1.5 rounded bg-neutral-900 px-1.5 py-0.5 align-[2px] text-[9px] font-extrabold uppercase tracking-wide text-white dark:bg-white dark:text-black">Popular</span>}</span>
                  <span className="block truncate text-xs text-neutral-500">{a.sub}</span></span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <Link href={h.more.href} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold underline underline-offset-4">{h.more.label} <ArrowRight className="h-4 w-4" /></Link>
    </div>
  ) : (
    <div className="hidden h-full min-h-[320px] flex-col items-center justify-center text-center lg:flex">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-700"><ArrowLeft className="h-6 w-6" /></span>
      <p className="mt-4 font-bold">Pick what you have</p>
      <p className="mt-1 max-w-xs text-sm text-neutral-500">Then we show what you can do with it, in plain words. No need to know any tool names.</p>
    </div>
  );

  return (
    <section ref={top} id="finder" aria-label="Find the right tool" className="scroll-mt-20 overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800">
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className={`min-w-0 p-5 sm:p-8 ${have ? "max-lg:hidden" : ""}`}>{step1}</div>
        <div className={`min-w-0 bg-neutral-50 p-5 sm:p-8 dark:bg-neutral-950 lg:border-l lg:border-neutral-200 dark:lg:border-neutral-800 ${have ? "" : "max-lg:hidden"}`}>{step2}</div>
      </div>
    </section>
  );
}
