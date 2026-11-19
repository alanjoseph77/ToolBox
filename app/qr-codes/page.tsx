import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { tools } from "@/lib/tools";
import { QR_GUIDE, QR_SLUGS } from "@/lib/qrHub";
import { BRAND, SITE } from "@/lib/site";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

const title = "Free QR Code Maker – All QR Code Tools";
const description = "Make QR codes for links, Wi-Fi, WhatsApp, UPI payments, menus, products and business cards. 18 designs, your logo, PNG or SVG. Free, no sign-up.";
const url = `${SITE}/qr-codes`;

export const metadata: Metadata = {
  title, description, alternates: { canonical: url },
  openGraph: { type: "website", url, title: `${title} | ${BRAND.name}`, description, siteName: BRAND.name, images: [{ url: `${SITE}/opengraph-image.png`, width: 1200, height: 630, alt: "ToolBox by Otaga" }] },
};

export default function QrCodesPage() {
  const list = QR_SLUGS.map((s) => tools.find((t) => t.slug === s)).filter((t): t is (typeof tools)[number] => !!t);
  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CollectionPage", name: "QR codes", url, description, mainEntity: { "@type": "ItemList", itemListElement: list.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${t.slug}`, name: t.name })) } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "QR codes", item: url }] },
      ]} />
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-neutral-700">QR codes</span>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">QR codes</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-neutral-600">Every QR tool in one place: links, Wi-Fi, WhatsApp, UPI payments, restaurant menus, shop products and business cards. Pick from 18 designs, add your logo and a “Scan me” label, and download PNG or SVG for printing. Each design is checked to make sure phones can scan it.</p>

      <section aria-label="Which QR code do I need?" className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <h2 className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-bold dark:border-neutral-800 dark:bg-neutral-950">Which one do I need?</h2>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {QR_GUIDE.map(([want, name, slug]) => (
            <li key={slug}><Link href={`/${slug}`} className="flex min-h-[56px] items-center gap-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-950" data-testid={`qr-guide-${slug}`}>
              <span className="min-w-0 flex-1 text-sm text-neutral-600 dark:text-neutral-300">{want}</span>
              <span className="shrink-0 text-sm font-semibold">{name}</span><ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link></li>
          ))}
        </ul>
      </section>

      <h2 className="mt-10 text-lg font-bold">All QR tools</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
    </div>
  );
}
