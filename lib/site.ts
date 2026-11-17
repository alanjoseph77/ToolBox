// Canonical site address: explicit env var, else Vercel's production URL, else localhost.
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const BRAND = { name: "ToolBox", owner: "Otaga", ownerUrl: "https://otaga.in" };

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "otaga@otaga.in";

/** When the page text last changed. Update this when tool pages get new content, so search engines see a real date
 *  (a sitemap that says "changed today" on every build gets ignored). */
export const CONTENT_UPDATED = "2026-11-17";
