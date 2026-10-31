import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ – Common Questions",
  description: "Answers about how ToolBox works: privacy, cost, file limits, supported devices and more.",
  alternates: { canonical: `${SITE}/faq` },
};

const faqs: [string, string][] = [
  ["Are my files uploaded anywhere?", "No. Almost every tool processes your file in your browser, so it stays on your device. Tools that work differently say so on their page."],
  ["Is ToolBox really free?", "Yes. There is no account, no watermark and no paid plan. The site is supported by ads."],
  ["Do I need to create an account?", "No."],
  ["Is there a file size limit?", "There is no limit set by us. Your device's memory is the limit, so very large files and videos may be slow or fail on older phones."],
  ["Does it work on my phone?", "Yes. The site is designed for phones as well as computers, in light and dark mode."],
  ["Can I use one tool's result in another?", "Yes. After you save a file, choose the next tool from the Keep going bar and it opens with your file already loaded. This works while you stay on the site in the same tab."],
  ["Why did a tool not find my text?", "Tools that read text, such as Mask Aadhaar or Compare PDF, need clear text. For scanned PDFs, use PDF OCR first. Always check the result."],
  ["Who makes ToolBox?", "ToolBox is a product of Otaga, made in India."],
  ["How can I suggest a tool or report a problem?", "Use the Contact page."],
];

export default function Faq() {
  return (
    <LegalPage title="Frequently asked questions">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      {faqs.map(([q, a]) => <div key={q}><h2>{q}</h2><p>{a}</p></div>)}
    </LegalPage>
  );
}
