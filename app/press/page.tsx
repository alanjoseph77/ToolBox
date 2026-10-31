import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { tools } from "@/lib/tools";
import { BRAND, CONTACT_EMAIL, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Press – ToolBox by Otaga",
  description: "Facts, a short description and the logo for writing about ToolBox by Otaga.",
  alternates: { canonical: `${SITE}/press` },
};

export default function Press() {
  return (
    <LegalPage title="Press">
      <p>Writing about ToolBox? Here is what you need.</p>
      <h2>About in one line</h2>
      <p>ToolBox is a free collection of {tools.length} PDF, image, video, developer and utility tools that run in your browser, so your files stay on your device. It is a product of <a href={BRAND.ownerUrl} target="_blank" rel="noopener">Otaga</a>, made in India.</p>
      <h2>Quick facts</h2>
      <ul>
        <li>Name: ToolBox</li>
        <li>Made by: Otaga</li>
        <li>Website: <a href={SITE}>{SITE.replace(/^https?:\/\//, "")}</a></li>
        <li>Price: free, no ads</li>
        <li>Privacy: files are processed on your device, not uploaded</li>
      </ul>
      <h2>Logo</h2>
      <p><a href="/icon.svg" download>Download the ToolBox logo (SVG)</a></p>
      <h2>Contact</h2>
      {CONTACT_EMAIL ? <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p> : <p>Use the <Link href="/contact">contact page</Link>.</p>}
    </LegalPage>
  );
}
