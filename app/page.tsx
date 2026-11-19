import { AudioLines, Bot, ChevronRight, Code2, FileText, Image as ImageIcon, QrCode, ScanQrCode, Video, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import SmartSearch from "@/components/SmartSearch";
import FinderCard from "@/components/FinderCard";
import RecentTools from "@/components/RecentTools";
import ToolIcon from "@/components/ToolIcon";
import { categories, tools, type Category } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import { QR_SLUGS } from "@/lib/qrHub";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

// The home page is kept short on purpose: search, the sections, 8 popular tools, and a way in for people who
// don't know a tool's name. The full list lives on /tools and on each section's page.
const catIcon: Record<Category, LucideIcon> = { PDF: FileText, Image: ImageIcon, Video, Audio: AudioLines, AI: Bot, Share: ScanQrCode, Developer: Code2, Utility: Wrench };
const catName: Partial<Record<Category, string>> = { Utility: "Everyday" };
const POPULAR = ["compress-pdf", "remove-background", "reduce-image-size-kb", "merge-pdf", "qr-code-generator", "send-files", "pdf-to-word", "image-enhancer"];

export default function Home() {
  const sections = [
    ...categories.slice(0, 2).map((c) => ({ key: c as string, href: `/tools/${categorySeo[c].slug}`, Icon: catIcon[c], label: catName[c] ?? c, n: tools.filter((t) => t.category === c).length })),
    { key: "QR", href: "/qr-codes", Icon: QrCode, label: "QR codes", n: QR_SLUGS.length },
    ...categories.slice(2).map((c) => ({ key: c as string, href: `/tools/${categorySeo[c].slug}`, Icon: catIcon[c], label: catName[c] ?? c, n: tools.filter((t) => t.category === c).length })),
  ];
  const popular = POPULAR.map((s) => tools.find((t) => t.slug === s)).filter((t): t is (typeof tools)[number] => !!t);

  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "ToolBox tools", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${t.slug}`, name: t.name })) }} />

      <section className="pt-6 text-center sm:pt-12">
        <h1 className="mx-auto max-w-3xl animate-fade-up text-[2rem] font-extrabold leading-tight tracking-tight sm:text-6xl">What do you want to <span className="gradient-text">do</span> today?</h1>
        <p className="mx-auto mb-6 mt-3 text-sm text-neutral-500 sm:mb-8 sm:text-base">{tools.length} free tools · files stay on your device · no sign-up</p>
        <SmartSearch />
      </section>

      <nav aria-label="Browse by type" className="mt-8 sm:mt-10">
        <h2 className="mb-3 text-lg font-bold sm:sr-only">Browse</h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-8">
          {sections.map(({ key, href, Icon, label, n }) => (
            <Link key={key} href={href} className="group flex flex-col items-center gap-1.5 rounded-2xl text-xs font-semibold text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white" data-testid={`cat-${key}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black"><Icon className="h-6 w-6" aria-hidden /></span>
              <span className="text-center leading-tight">{label}<span className="block text-[11px] font-medium text-neutral-400">{n}</span></span>
            </Link>
          ))}
        </div>
      </nav>

      <RecentTools />

      <section aria-labelledby="popular" className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="popular" className="text-lg font-bold">Popular</h2>
          <Link href="/tools" className="flex items-center gap-0.5 text-sm font-semibold text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white" data-testid="all-tools-link">All {tools.length} tools <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {popular.map((t) => (
            <Link key={t.slug} href={`/${t.slug}`} className="flex min-h-[60px] items-center gap-3 rounded-2xl bg-neutral-50 p-3 text-sm font-semibold leading-snug transition hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-900" data-testid="popular-tile">
              <ToolIcon tool={t} /><span className="min-w-0">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <FinderCard />

      <section aria-label="About ToolBox" className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-xs font-semibold text-neutral-500">🔒 Files stay on your device · No sign-up, no watermark · Works great on phones · Made in India</p>
        <p className="mt-3 text-xs leading-relaxed text-neutral-400">ToolBox by Otaga: compress and merge PDFs, convert PDF to Word, compress photos to 50 KB for forms, remove backgrounds, make passport photos and QR codes, trim videos and more, free in your browser.</p>
      </section>
    </div>
  );
}
