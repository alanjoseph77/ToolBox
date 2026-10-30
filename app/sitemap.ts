import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://toolbox.example";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE, changeFrequency: "weekly", priority: 1 }, ...tools.map((t) => ({ url: `${SITE}/${t.slug}`, changeFrequency: "monthly" as const, priority: t.popular ? 0.9 : 0.7 }))];
}
