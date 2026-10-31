import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing – ToolBox is Free",
  description: "ToolBox is free to use with no account, no watermark and no limits on the tools.",
  alternates: { canonical: `${SITE}/pricing` },
};

export default function Pricing() {
  return (
    <LegalPage title="Pricing">
      <p><b>ToolBox is free.</b> There are no plans to pick, no account to create and no watermark on your files.</p>
      <h2>No ads</h2>
      <p>ToolBox shows no ads and does not track you across other sites. See our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookies</Link> page.</p>
      <h2>Paid plans</h2>
      <p>We do not sell a paid plan today. If that changes, the tools that are free now will stay free.</p>
      <p>Want a tool added? <Link href="/contact">Tell us</Link>.</p>
    </LegalPage>
  );
}
