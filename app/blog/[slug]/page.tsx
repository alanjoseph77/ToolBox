import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LegalPage from "@/components/LegalPage";
import { getTool } from "@/lib/tools";
import { postBySlug, posts } from "@/lib/posts";
import { BRAND, SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => posts.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `${SITE}/blog/${p.slug}` } };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  const tool = getTool(p.tool);
  return (
    <LegalPage title={p.title}>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, datePublished: p.date, author: { "@type": "Organization", name: BRAND.owner }, publisher: { "@type": "Organization", name: BRAND.owner } }} />
      <p className="text-sm text-neutral-500">{new Date(p.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
      {p.body.map((b, i) => (
        <div key={i}>
          {b.h && <h2>{b.h}</h2>}
          {b.p && <p>{b.p}</p>}
          {b.ul && <ul>{b.ul.map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>
      ))}
      {tool && <p><Link href={`/${tool.slug}`} className="btn no-underline">Open {tool.name}</Link></p>}
      <p><Link href="/blog">← All guides</Link></p>
    </LegalPage>
  );
}
