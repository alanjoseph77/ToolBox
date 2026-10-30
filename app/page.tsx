import { Gauge, IndianRupee, ShieldCheck, Smartphone, Sparkles, UserX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import ToolSearch from "@/components/ToolSearch";
import ToolBrowser from "@/components/ToolBrowser";
import { tools } from "@/lib/tools";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Private by design", text: "Files are processed on your device and never uploaded." },
  { icon: UserX, title: "No account needed", text: "Open a tool and get it done. No sign-up, no waiting." },
  { icon: Smartphone, title: "Built for mobile", text: "Big touch targets and fast pages that work great on Android." },
  { icon: Gauge, title: "Exact file sizes", text: "Hit 50 KB, 100 KB or 200 KB targets for forms and exams." },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="relative -mt-4 px-0 pb-4 pt-12 text-center">
        <p className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-black dark:text-neutral-200"><Sparkles className="h-3.5 w-3.5" /> {tools.length} free tools · 100% private · no sign-up</p>
        <h1 className="mx-auto max-w-3xl animate-fade-up text-4xl font-extrabold tracking-tight sm:text-6xl">
          All your tools <span className="gradient-text">in one place</span>
        </h1>
        <p className="mx-auto mb-8 mt-4 max-w-xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">Compress PDFs, remove backgrounds, convert files, edit videos and more. Fast, free and private on your device.</p>
        <ToolSearch />
      </section>

      <section aria-label="Why ToolBox" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800"><Icon className="h-5 w-5" aria-hidden /></span>
            <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-sm text-neutral-500">{text}</p></div>
          </div>
        ))}
      </section>

      <ToolBrowser />

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
