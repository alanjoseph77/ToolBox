// Canonical site address: explicit env var, else Vercel's production URL, else localhost.
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const BRAND = { name: "ToolBox", owner: "Otaga", ownerUrl: "https://otaga.in" };

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "otaga@otaga.in";
