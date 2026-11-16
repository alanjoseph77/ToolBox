import type { Metadata } from "next";
import QrPageView from "@/components/QrPageView";

// These pages belong to the people who make them, so search engines are asked to stay away.
export const metadata: Metadata = { title: "Page", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-md py-2">
      <style>{"body > header, body > footer { display: none !important; }"}</style>
      <QrPageView id={(await params).id} />
    </div>
  );
}
