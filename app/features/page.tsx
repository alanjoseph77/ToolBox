import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { tools } from "@/lib/tools";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Features – Private, Free Online Tools",
  description: "What makes ToolBox different: files stay on your device, no sign-up, no watermark, and tools that work together without re-uploading.",
  alternates: { canonical: `${SITE}/features` },
};

export default function Features() {
  return (
    <LegalPage title="Features">
      <h2>Your files stay on your device</h2>
      <p>Almost every tool runs in your browser, so your documents and photos are not uploaded to a server. The exceptions are labelled on the tool page.</p>
      <h2>Free, with no sign-up and no watermark</h2>
      <p>Use any of the {tools.length} tools without an account. Nothing you save has a watermark added.</p>
      <h2>Chain tools without re-uploading</h2>
      <p>After a tool saves a file, ToolBox offers the next step, for example resize, then compress, then convert. The file moves to the next tool in memory, so you do not add it again.</p>
      <h2>Made for India</h2>
      <ul>
        <li>Passport photo and exam-form size presets.</li>
        <li><Link href="/mask-aadhaar">Mask Aadhaar</Link>, <Link href="/upi-qr-generator">UPI QR generator</Link>, <Link href="/emi-calculator">EMI</Link> and <Link href="/gst-calculator">GST</Link> calculators.</li>
      </ul>
      <h2>Works on your phone</h2>
      <p>The site is built for small screens, with light and dark mode. An Expo mobile app for Android and iOS is also in the works.</p>
      <p><Link href="/">Browse all tools</Link></p>
    </LegalPage>
  );
}
