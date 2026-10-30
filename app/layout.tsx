import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools } from "@/lib/tools";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://toolbox.example";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ToolBox – All Your Tools in One Place", template: "%s | ToolBox" },
  description: "Merge, split and compress PDFs, compress and resize images, remove backgrounds, edit videos and more. Free, private, no signup.",
  applicationName: "ToolBox",
  openGraph: { type: "website", siteName: "ToolBox", title: "ToolBox – All Your Tools in One Place", description: `${tools.length} free, private tools for PDFs, images, video and more.` },
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
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
