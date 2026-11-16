import type { Metadata } from "next";
import Link from "next/link";
import TemplateGallery from "@/components/TemplateGallery";
import { SITE } from "@/lib/site";

const title = "QR Code Templates for Shops – Boutique, Bakery, Jewellery, Kirana";
const description = "Pick a ready-made QR code design for your shop: boutique, jewellery, bakery, grocery, mobile shop, salon, crafts, plants or restaurant. Choose colours and a poster layout, then make it your own. Free.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE}/product-qr/templates` },
  openGraph: { type: "website", url: `${SITE}/product-qr/templates`, title, description },
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-neutral-500" aria-label="Breadcrumb"><Link href="/" className="hover:underline">Home</Link> › <Link href="/tools/share" className="hover:underline">Share tools</Link> › <Link href="/product-qr" className="hover:underline">Shop Product QR Code</Link> › Templates</nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">QR code templates for your shop</h1>
        <p className="max-w-2xl text-neutral-600">Pick a design that fits your business. Each one comes with colours, a poster layout, a QR style and sample text. Tap <b>Use this template</b>, then replace the sample with your own product, photo and price.</p>
      </header>
      <TemplateGallery />
    </div>
  );
}
