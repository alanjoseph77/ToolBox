import { Gauge, IndianRupee, Link2, ShieldCheck, Smartphone, UserX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import ToolSearch from "@/components/ToolSearch";
import ToolBrowser from "@/components/ToolBrowser";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Private by design", text: "Files are processed on your device and never uploaded." },
  { icon: UserX, title: "No account needed", text: "Open a tool and get it done. No sign-up, no waiting." },
  { icon: Smartphone, title: "Built for mobile", text: "Big touch targets and fast pages that work great on Android." },
  { icon: Gauge, title: "Exact file sizes", text: "Hit 50 KB, 100 KB or 200 KB targets for forms and exams." },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="relative -mt-8 px-0 pb-4 pt-14 text-center">
        {/* full-bleed backdrop: spans the viewport even though the page content is width-limited */}
        <div aria-hidden className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-gradient-to-b from-brand-50 via-slate-50 to-transparent dark:from-brand-800/20 dark:via-transparent" />
        <div aria-hidden className="absolute left-1/2 top-4 -z-10 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/60 via-fuchsia-200/50 to-sky-200/60 blur-3xl dark:opacity-20" />
        <p className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-slate-900/60 dark:text-brand-200"><ShieldCheck className="h-3.5 w-3.5" /> 47 free tools · 100% private</p>
        <h1 className="mx-auto max-w-3xl animate-fade-up text-4xl font-extrabold tracking-tight sm:text-6xl">
          All your tools <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">in one place</span>
        </h1>
        <p className="mx-auto mb-8 mt-4 max-w-xl text-base text-slate-600 sm:text-lg">Compress PDFs, remove backgrounds, convert files, edit videos and more. Fast, free and private on your device.</p>
        <ToolSearch />
      </section>

      <section aria-label="Why ToolBox" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-200"><Icon className="h-5 w-5" aria-hidden /></span>
            <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-sm text-slate-500">{text}</p></div>
          </div>
        ))}
      </section>

      <ToolBrowser />

      <section className="card flex flex-col items-start gap-4 overflow-hidden bg-gradient-to-br from-brand-600 to-fuchsia-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8 !border-transparent">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><IndianRupee className="h-6 w-6" aria-hidden /></span>
          <div><h2 className="text-xl font-bold">Made for India</h2><p className="mt-1 max-w-xl text-sm text-white/85">Passport and visa photos, exam-form images under 50 KB, signature sizes and document scans, all with presets ready to go.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/passport-photo-maker" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Passport photo</Link>
          <Link href="/compress-image" className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25">Compress to 50 KB</Link>
        </div>
      </section>
    </div>
  );
}
