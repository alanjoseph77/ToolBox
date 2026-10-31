import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "What ToolBox stores in your browser.",
  alternates: { canonical: `${SITE}/cookies` },
};

export default function Cookies() {
  return (
    <LegalPage title="Cookies policy">
      <p>This page explains what is stored in your browser when you use ToolBox. For everything else about your data, read our <Link href="/privacy">Privacy Policy</Link>.</p>
      <h2>What ToolBox stores itself</h2>
      <ul>
        <li><b>Theme.</b> Whether you chose light or dark mode.</li>
        <li><b>Recently used tools.</b> A short list of the tools you opened, shown on the home page. It stays in your browser and is never sent to us. You can clear it from the home page.</li>
      </ul>
      <p>These use your browser&apos;s local storage, not tracking cookies. Your files are never stored.</p>
      <h2>Advertising and tracking</h2>
      <p>ToolBox shows no ads and uses no advertising or tracking cookies.</p>
      <h2>Control cookies</h2>
      <p>You can block or delete cookies and site data in your browser settings. ToolBox keeps working, but your theme and recent tools will not be remembered.</p>
    </LegalPage>
  );
}
