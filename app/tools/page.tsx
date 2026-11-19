import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import ToolBrowser from "@/components/ToolBrowser";
import { tools } from "@/lib/tools";
import { BRAND, SITE } from "@/lib/site";

const title = `All ${tools.length} Free Online Tools – PDF, Image, Video, QR`;
const description = "Every ToolBox tool in one list: PDF, image, video, audio, QR codes, sharing, developer and everyday tools. Free, private and no sign-up.";
export const metadata: Metadata = { title, description, alternates: { canonical: `${SITE}/tools` }, openGraph: { type: "website", url: `${SITE}/tools`, title: `${title} | ${BRAND.name}`, description, siteName: BRAND.name } };

export default function AllTools() {
  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-neutral-700">All tools</span>
      </nav>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">All tools <span className="text-xl font-semibold text-neutral-400">({tools.length})</span></h1>
      <ToolBrowser />
    </div>
  );
}
