import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ToolBox by Otaga handles your files, data, cookies and advertising. Your files are processed on your device and never uploaded.",
  alternates: { canonical: `${SITE}/privacy` },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="30 October 2026">
      <p>ToolBox is a product of <a href="https://otaga.in" target="_blank" rel="noopener">Otaga</a>. This policy explains what happens to your information when you use ToolBox.</p>

      <h2>Your files stay on your device</h2>
      <p>The PDF, image, video and utility tools process your files locally in your browser. Your files, text and images are not uploaded to our servers.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Technical logs.</b> Our hosting provider (Vercel) may record standard request data such as IP address, browser type and the pages requested, for security and reliability.</li>
        <li><b>Preferences on your device.</b> We store your theme choice and a list of recently used tools in your browser&apos;s local storage. This never leaves your device and you can clear it at any time.</li>
        <li><b>No accounts.</b> You do not need to sign up, so we hold no profile information about you.</li>
      </ul>

      <h2>Third-party services</h2>
      <ul>
        <li><b>Content delivery.</b> Some tools download open-source models or language data from public servers the first time you use them (for example the background-removal model from jsDelivr, and OCR language data for languages other than English). Those servers can see your IP address when you download these files. Your own files are not sent.</li>
      </ul>

      <h2>Children</h2>
      <p>ToolBox is not directed at children under 13 and we do not knowingly collect their personal information.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date above when we do.</p>

      <h2>Contact</h2>
      <p>Questions about privacy? {CONTACT_EMAIL ? <>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> : <>Reach us through <a href="/contact">the contact page</a>.</>}</p>
    </LegalPage>
  );
}
