import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "ToolBox – All Your Tools in One Place", template: "%s | ToolBox" },
  description: "Merge, split and compress PDFs, compress and resize images, remove backgrounds and make QR codes. Free, private, no signup.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="py-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} ToolBox · Files are processed in your browser and never uploaded.</footer>
      </body>
    </html>
  );
}
