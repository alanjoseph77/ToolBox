import type { MetadataRoute } from "next";
import { categories, tools } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import { posts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...categories.map((c) => ({ url: `${SITE}/tools/${categorySeo[c].slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["about", "contact", "privacy", "terms", "cookies", "features", "pricing", "faq", "press", "blog"].map((p) => ({ url: `${SITE}/${p}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "yearly" as const, priority: 0.5 })),
    ...tools.map((t) => ({ url: `${SITE}/${t.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: t.popular ? 0.9 : 0.7 })),
  ];
}
