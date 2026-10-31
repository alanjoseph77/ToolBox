import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { posts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog – ToolBox Guides",
  description: "Short, practical guides for everyday file tasks: photo sizes, compressing images for forms, masking documents and more.",
  alternates: { canonical: `${SITE}/blog` },
};

export default function Blog() {
  return (
    <LegalPage title="Blog">
      <p>Short guides for everyday file tasks.</p>
      <ul className="!list-none !ml-0 space-y-4">
        {posts.map((p) => (
          <li key={p.slug} className="!ml-0 !list-none rounded-xl border p-4">
            <Link href={`/blog/${p.slug}`} className="text-lg font-bold no-underline hover:underline">{p.title}</Link>
            <p className="mt-1 text-sm">{p.description}</p>
            <p className="mt-1 text-xs text-neutral-500">{new Date(p.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
