import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, ChevronRight, Cpu, Sparkles } from "lucide-react";
import { getTool, tools } from "@/lib/tools";
import { categoryStyle } from "@/lib/icons";
import ToolRunner from "@/components/ToolRunner";
import ToolIcon from "@/components/ToolIcon";
import ToolCard from "@/components/ToolCard";
import RecordVisit from "@/components/RecordVisit";

export const dynamicParams = false;
export const generateStaticParams = () => tools.map((t) => ({ tool: t.slug }));

export function generateMetadata({ params }: { params: { tool: string } }): Metadata {
  const t = getTool(params.tool);
  return t ? { title: t.name, description: t.description, openGraph: { title: `${t.name} | ToolBox`, description: t.description } } : {};
}

const steps: Record<string, [string, string, string, string]> = {
  PDF: ["Add your PDF", "Choose a file from your phone or computer. It never leaves your device.", "Adjust and run", "Pick your options, then tap the main button."],
  Image: ["Add your image", "Choose a photo or drop one in. It stays on your device.", "Adjust and run", "Set size, format or area, then tap the main button."],
  Video: ["Add your video", "Choose a clip. It is processed locally in your browser.", "Adjust and run", "Pick quality or timing, then start. Long videos take a moment."],
  AI: ["Add your content", "Paste text or add an image. Only what the AI needs is sent.", "Generate", "Review the result, then copy or download it."],
  Developer: ["Paste your input", "Everything runs in your browser. Nothing is sent anywhere.", "Get the result", "Copy it with one tap."],
  Utility: ["Enter or add your data", "All calculations happen right in your browser.", "Use the result", "Copy it or download it."],
};

export default function ToolPage({ params }: { params: { tool: string } }) {
  const t = getTool(params.tool);
  if (!t) notFound();
  const s = steps[t.category];
  const related = tools.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 4);
  const isAi = t.category === "AI" || t.slug === "pdf-summarizer";

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <RecordVisit slug={t.slug} />
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/#${t.category.toLowerCase()}`} className="hover:text-black dark:hover:text-white">{categoryStyle[t.category].label}</Link><ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-neutral-700">{t.name}</span>
      </nav>
      <header className="mb-6 flex items-start gap-4">
        <ToolIcon tool={t} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.name}</h1>
          <p className="mt-1 text-neutral-600">{t.description}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
            {isAi ? <><Sparkles className="h-3.5 w-3.5" /> Uses AI · sends only what is needed</> : <><BadgeCheck className="h-3.5 w-3.5" /> Runs on your device · no upload</>}
          </p>
        </div>
      </header>

      <ToolRunner slug={t.slug} />

      <section aria-label="How it works" className="mt-12 grid gap-4 sm:grid-cols-3">
        {[[s[0], s[1]], [s[2], s[3]], ["Download", "Save the result. No watermark, no sign-up."]].map(([title, text], i) => (
          <div key={title} className="card p-4">
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{text}</p>
          </div>
        ))}
      </section>

      {related.length > 0 && (
        <section aria-label="Related tools" className="mt-12">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Cpu className="h-5 w-5 text-neutral-400" /> More {categoryStyle[t.category].label.toLowerCase()}</h2>
          <div className="grid gap-3 sm:grid-cols-2">{related.map((r) => <ToolCard key={r.slug} tool={r} />)}</div>
        </section>
      )}
    </div>
  );
}
