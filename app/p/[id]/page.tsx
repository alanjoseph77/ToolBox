import type { Metadata } from "next";
import ProductView from "@/components/ProductView";

// Product pages belong to the shops that make them, so search engines are asked to stay away.
export const metadata: Metadata = { title: "Product", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-md py-2">
      {/* a shopper who scans a QR code sees only the product: the site menu and the long footer are hidden on this page */}
      <style>{"body > header, body > footer { display: none !important; }"}</style>
      <ProductView id={(await params).id} />
    </div>
  );
}
