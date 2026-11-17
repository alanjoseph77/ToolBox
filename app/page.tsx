import { AudioLines, Bot, Code2, FileText, Gauge, Image as ImageIcon, IndianRupee, ScanQrCode, ShieldCheck, Smartphone, Sparkles, UserX, Video, Wrench, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/tools";
import Link from "next/link";
import SmartSearch from "@/components/SmartSearch";
import ToolFinder from "@/components/ToolFinder";
import { categories } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import ToolBrowser from "@/components/ToolBrowser";
import { tools } from "@/lib/tools";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Private by design", text: "Files are processed on your device and never uploaded." },
  { icon: UserX, title: "No account needed", text: "Open a tool and get it done. No sign-up, no waiting." },
  { icon: Smartphone, title: "Built for mobile", text: "Big touch targets and fast pages that work great on Android." },
  { icon: Gauge, title: "Exact file sizes", text: "Hit 50 KB, 100 KB or 200 KB targets for forms and exams." },
];

const catIcon: Record<Category, LucideIcon> = { PDF: FileText, Image: ImageIcon, Video, Audio: AudioLines, AI: Bot, Share: ScanQrCode, Developer: Code2, Utility: Wrench };
const catName: Partial<Record<Category, string>> = { Share: "Share & QR", Utility: "Everyday" };

export default function Home() {
  return (
    <div className="space-y-14">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "ToolBox tools", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${t.slug}`, name: t.name })) }} />
      <section className="relative -mt-4 px-0 pb-4 pt-12 text-center">
        <p className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-black dark:text-neutral-200"><Sparkles className="h-3.5 w-3.5" /> {tools.length} free tools · 100% private · no sign-up</p>
        <h1 className="mx-auto max-w-3xl animate-fade-up text-4xl font-extrabold tracking-tight sm:text-6xl">
          What do you want to <span className="gradient-text">do</span> today?
        </h1>
        <p className="mx-auto mb-8 mt-4 max-w-xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">All your tools in one place: PDF, photos, video, audio, QR codes and more. Fast, free and private on your device.</p>
        <SmartSearch />
        <nav aria-label="Browse by type" className="-mx-4 mt-8 flex justify-start gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:justify-center">
          {categories.map((c) => { const Icon = catIcon[c]; return (
            <Link key={c} href={`/tools/${categorySeo[c].slug}`} className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl py-1 text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white" data-testid={`cat-${c}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black"><Icon className="h-6 w-6" aria-hidden /></span>
              <span className="text-center leading-tight">{catName[c] ?? c}</span>
            </Link>); })}
        </nav>
      </section>

      <div className="space-y-3">
        <p className="text-center text-sm text-neutral-500">Don&apos;t know the tool&apos;s name? Answer two quick questions.</p>
        <ToolFinder />
      </div>

      <section aria-label="Why ToolBox" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800"><Icon className="h-5 w-5" aria-hidden /></span>
            <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-sm text-neutral-500">{text}</p></div>
          </div>
        ))}
      </section>

      <ToolBrowser />

      <section aria-label="About ToolBox" className="mx-auto max-w-3xl space-y-3 text-center">
        <h2 className="text-2xl font-bold">Free online PDF, image and video tools</h2>
        <p className="leading-relaxed text-neutral-600">ToolBox by Otaga brings the tools you use every day into one fast, private place. Merge, split and compress PDFs, convert PDF to Word or Excel, compress photos to an exact size like 50 KB, resize and crop images, remove backgrounds, make passport photos, trim and convert videos, create GIFs and QR codes, and use handy developer utilities. Everything runs in your browser, so your files never leave your device, and there is no sign-up or watermark.</p>
      </section>

      <section className="flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><IndianRupee className="h-6 w-6" aria-hidden /></span>
          <div><h2 className="text-xl font-bold">Made for India</h2><p className="mt-1 max-w-xl text-sm text-white/85">Passport and visa photos, exam-form images under 50 KB, signature sizes and document scans, all with presets ready to go.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/passport-photo-maker" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200">Passport photo</Link>
          <Link href="/compress-image" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Compress to 50 KB</Link>
        </div>
      </section>
    </div>
  );
}
