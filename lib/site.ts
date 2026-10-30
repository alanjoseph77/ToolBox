// Canonical site address: explicit env var, else Vercel's production URL, else localhost.
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const BRAND = { name: "ToolBox", owner: "Otaga", ownerUrl: "https://otaga.in" };

// Advertising (Google AdSense). Nothing is loaded or shown until NEXT_PUBLIC_ADSENSE_CLIENT is set.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ""; // e.g. ca-pub-1234567890123456
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";     // optional ad unit id for manual placements
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
