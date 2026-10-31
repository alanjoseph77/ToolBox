import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { ADSENSE_CLIENT, MONETAG_ZONE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "What ToolBox stores in your browser and how advertising cookies work.",
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
      {(ADSENSE_CLIENT || MONETAG_ZONE) && (
        <>
          <h2>Advertising</h2>
          <p>Some pages show ads from third parties{ADSENSE_CLIENT ? " such as Google AdSense" : ""}{MONETAG_ZONE ? `${ADSENSE_CLIENT ? " and" : " such as"} Monetag` : ""}. These companies may set cookies or use similar technologies to choose and measure ads. We do not control them, and they never receive your files.</p>
          {ADSENSE_CLIENT && <p>You can manage personalised ads at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener">aboutads.info</a>.</p>}
        </>
      )}
      <h2>Control cookies</h2>
      <p>You can block or delete cookies and site data in your browser settings. ToolBox keeps working, but your theme and recent tools will not be remembered.</p>
    </LegalPage>
  );
}
