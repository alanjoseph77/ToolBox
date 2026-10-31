// Canonical site address: explicit env var, else Vercel's production URL, else localhost.
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const BRAND = { name: "ToolBox", owner: "Otaga", ownerUrl: "https://otaga.in" };

// Advertising (Google AdSense). Nothing is loaded or shown until NEXT_PUBLIC_ADSENSE_CLIENT is set.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ""; // e.g. ca-pub-1234567890123456
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";     // optional ad unit id for manual placements
// Site-ownership token for Monetag (public by design: it is just a meta tag).
export const MONETAG_VERIFICATION = process.env.NEXT_PUBLIC_MONETAG_VERIFICATION || "8b29b54abf01da3daef1e7a6bd23a242";
// Monetag Vignette banner (zone id and script are public). Set NEXT_PUBLIC_MONETAG_ZONE="" to turn it off.
export const MONETAG_ZONE = process.env.NEXT_PUBLIC_MONETAG_ZONE ?? "12155431";
export const MONETAG_SRC = "https://n6wxm.com/vignette.min.js";
// By default the banner never runs on tool pages, so it cannot cover an upload or download.
export const MONETAG_ON_TOOLS = process.env.NEXT_PUBLIC_MONETAG_ON_TOOLS === "true";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "otaga@otaga.in";
