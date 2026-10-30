import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { tools } from "@/lib/tools";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About ToolBox",
  description: "ToolBox by Otaga is a free, private collection of PDF, image, video and developer tools that run in your browser.",
  alternates: { canonical: `${SITE}/about` },
};

export default function About() {
  return (
    <LegalPage title="About ToolBox">
      <p>ToolBox is a free collection of {tools.length} everyday tools for PDFs, images, video, developers and general utilities, built by <a href="https://otaga.in" target="_blank" rel="noopener">Otaga</a> in India.</p>
      <h2>Why we built it</h2>
      <p>Most online file tools ask you to upload your documents to a server, add watermarks or force a sign-up. We wanted something faster and more private: tools that run right in your browser, so your files stay on your device.</p>
      <h2>What makes it different</h2>
      <ul>
        <li>Your files are processed on your device, not uploaded.</li>
        <li>No account and no watermark.</li>
        <li>Made to work well on phones, in light and dark mode.</li>
        <li>Presets for passport photos and exam-form image sizes.</li>
      </ul>
      <p>Explore the <Link href="/">full list of tools</Link>, or <Link href="/contact">get in touch</Link> to suggest one.</p>
    </LegalPage>
  );
}
