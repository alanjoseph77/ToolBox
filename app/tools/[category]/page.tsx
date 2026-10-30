import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { categories, tools, type Category } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import { BRAND, SITE } from "@/lib/site";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const dynamicParams = false;
const bySlug = (slug: string) => categories.find((c) => categorySeo[c]?.slug === slug) as Category | undefined;
export const generateStaticParams = () => categories.map((c) => ({ category: categorySeo[c].slug }));

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const c = bySlug(params.category);
  if (!c) return {};
  const seo = categorySeo[c];
  const url = `${SITE}/tools/${seo.slug}`;
  return {
    title: seo.title, description: seo.description, alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${seo.title} | ${BRAND.name}`, description: seo.description, siteName: BRAND.name, images: [{ url: `${SITE}/opengraph-image.png`, width: 1200, height: 630, alt: "ToolBox by Otaga" }] },
    twitter: { card: "summary_large_image", title: `${seo.title} | ${BRAND.name}`, description: seo.description, images: [`${SITE}/twitter-image.png`] },
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const c = bySlug(params.category);
  if (!c) notFound();
  const seo = categorySeo[c];
  const list = tools.filter((t) => t.category === c);
  const url = `${SITE}/tools/${seo.slug}`;

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CollectionPage", name: seo.h1, url, description: seo.description,
          mainEntity: { "@type": "ItemList", itemListElement: list.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${t.slug}`, name: t.name })) } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: seo.h1, item: url }] },
      ]} />
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-neutral-700">{seo.h1}</span>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{seo.h1}</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-neutral-600">{seo.intro}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
      <AdSlot />
      <div className="mt-12 flex flex-wrap gap-2">
        <span className="text-sm text-neutral-500">More tools:</span>
        {categories.filter((x) => x !== c).map((x) => <Link key={x} href={`/tools/${categorySeo[x].slug}`} className="chip !py-1 text-xs">{categorySeo[x].h1}</Link>)}
      </div>
    </div>
  );
}
