import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools } from "@/lib/tools";
import { ADSENSE_CLIENT, BRAND, MONETAG_VERIFICATION, SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSense from "@/components/AdSense";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ToolBox – Free Online PDF, Image & Video Tools | Otaga", template: "%s | ToolBox" },
  description: `Free online PDF, image and video tools: merge, compress, convert, resize, remove backgrounds and more. ${tools.length} private tools that run in your browser. No sign-up.`,
  applicationName: "ToolBox",
  authors: [{ name: "Otaga", url: "https://otaga.in" }],
  creator: "Otaga",
  publisher: "Otaga",
  alternates: { canonical: SITE },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: "ToolBox", url: SITE, locale: "en_IN", title: "ToolBox – Free Online PDF, Image & Video Tools", description: `${tools.length} free, private tools for PDFs, images, video and more. No sign-up, no uploads.` },
  twitter: { card: "summary_large_image", title: "ToolBox – Free Online PDF, Image & Video Tools", description: `${tools.length} free, private tools that run in your browser.` },
  other: { ...(ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : {}), ...(MONETAG_VERIFICATION ? { monetag: MONETAG_VERIFICATION } : {}) },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: "#ffffff",
};

// Runs before paint so the saved/system theme is applied without a flash.
// Light is the default; a saved "dark" choice is applied before paint to avoid a flash.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AdSense />
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "Organization", name: BRAND.owner, url: BRAND.ownerUrl, brand: { "@type": "Brand", name: BRAND.name } },
          { "@context": "https://schema.org", "@type": "WebSite", name: BRAND.name, url: SITE, publisher: { "@type": "Organization", name: BRAND.owner }, inLanguage: "en-IN" },
        ]} />
      </head>
      <body>
        
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
