import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, ChevronRight, Cpu, Sparkles } from "lucide-react";
import { getTool, tools } from "@/lib/tools";
import { categoryStyle } from "@/lib/icons";
import { toolSeo } from "@/lib/seo";
import { posts } from "@/lib/posts";
import { BRAND, SITE } from "@/lib/site";
import ToolRunner from "@/components/ToolRunner";
import ToolIcon from "@/components/ToolIcon";
import ToolCard from "@/components/ToolCard";
import RecordVisit from "@/components/RecordVisit";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const dynamicParams = false;
export const generateStaticParams = () => tools.map((t) => ({ tool: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const t = getTool((await params).tool);
  if (!t) return {};
  const seo = toolSeo[t.slug];
  const title = seo?.title ?? t.name;
  const description = seo?.description ?? t.description;
  const url = `${SITE}/${t.slug}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${title} | ${BRAND.name}`, description, siteName: BRAND.name, images: [{ url: `${SITE}/opengraph-image.png`, width: 1200, height: 630, alt: "ToolBox by Otaga" }] },
    twitter: { card: "summary_large_image", title: `${title} | ${BRAND.name}`, description, images: [`${SITE}/twitter-image.png`] },
  };
}

const steps: Record<string, [string, string, string, string]> = {
  PDF: ["Add your PDF", "Choose a file from your phone or computer. It never leaves your device.", "Adjust and run", "Pick your options, then tap the main button."],
  Image: ["Add your image", "Choose a photo or drop one in. It stays on your device.", "Adjust and run", "Set size, format or area, then tap the main button."],
  Video: ["Add your video", "Choose a clip. It is processed locally in your browser.", "Adjust and run", "Pick quality or timing, then start. Long videos take a moment."],
  AI: ["Add your content", "Paste text or add an image. Only what the AI needs is sent.", "Generate", "Review the result, then copy or download it."],
  Developer: ["Paste your input", "Everything runs in your browser. Nothing is sent anywhere.", "Get the result", "Copy it with one tap."],
  Utility: ["Enter or add your data", "All calculations happen right in your browser.", "Use the result", "Copy it or download it."],
};

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const t = getTool((await params).tool);
  if (!t) notFound();
  const seo = toolSeo[t.slug];
  const s = steps[t.category];
  const related = tools.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 4);
  const isAi = t.category === "AI" || t.slug === "pdf-summarizer";
  const url = `${SITE}/${t.slug}`;
  const catUrl = `${SITE}/tools/${t.category.toLowerCase()}`;

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: t.name, url,
      description: seo?.description ?? t.description, applicationCategory: seo?.kind ?? "UtilityApplication",
      operatingSystem: "Any", browserRequirements: "Requires a modern web browser", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      publisher: { "@type": "Organization", name: BRAND.owner, url: BRAND.ownerUrl },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: categoryStyle[t.category].label, item: catUrl },
        { "@type": "ListItem", position: 3, name: t.name, item: url },
      ],
    },
    ...(seo?.faqs.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: seo.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <JsonLd data={jsonLd} />
      <RecordVisit slug={t.slug} />
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/tools/${t.category.toLowerCase()}`} className="hover:text-black dark:hover:text-white">{categoryStyle[t.category].label}</Link><ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-neutral-700">{t.name}</span>
      </nav>
      <header className="mb-6 flex items-start gap-4">
        <ToolIcon tool={t} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.name}</h1>
          <p className="mt-1 text-neutral-600">{t.description}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
            {isAi ? <><Sparkles className="h-3.5 w-3.5" /> Free AI · only what you submit is sent</> : <><BadgeCheck className="h-3.5 w-3.5" /> Runs on your device · no upload</>}
          </p>
        </div>
      </header>

      <ToolRunner slug={t.slug} />

      {seo && (
        <section aria-label={`About ${t.name}`} className="mt-12 space-y-3">
          <h2 className="text-xl font-bold">About {t.name}</h2>
          <p className="leading-relaxed text-neutral-600">{seo.intro}</p>
        </section>
      )}

      <section aria-label="How it works" className="mt-10 grid gap-4 sm:grid-cols-3">
        {[[s[0], s[1]], [s[2], s[3]], ["Download", "Save the result. No watermark, no sign-up."]].map(([title, text], i) => (
          <div key={title} className="card p-4">
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{text}</p>
          </div>
        ))}
      </section>

      <AdSlot />

      {seo && (
        <section aria-label="Frequently asked questions" className="mt-12">
          <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
          <div className="card divide-y">
            {seo.faqs.map(([q, a]) => (
              <details key={q} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" aria-hidden /></summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {posts.some((x) => x.tool === t.slug) && (
        <section aria-label="Guides" className="mt-12">
          <h2 className="mb-3 text-lg font-bold">Guides</h2>
          <ul className="space-y-2 text-sm">{posts.filter((x) => x.tool === t.slug).map((x) => <li key={x.slug}><Link href={`/blog/${x.slug}`} className="font-medium underline underline-offset-4">{x.title}</Link></li>)}</ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-label="Related tools" className="mt-12">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Cpu className="h-5 w-5 text-neutral-400" /> More {categoryStyle[t.category].label.toLowerCase()}</h2>
          <div className="grid gap-3 sm:grid-cols-2">{related.map((r) => <ToolCard key={r.slug} tool={r} />)}</div>
        </section>
      )}
    </div>
  );
}
