import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the ToolBox team at Otaga for feedback, tool suggestions or support.",
  alternates: { canonical: `${SITE}/contact` },
};

export default function Contact() {
  return (
    <LegalPage title="Contact us">
      <p>Have feedback, found a bug or want a tool added? We would love to hear from you.</p>
      {CONTACT_EMAIL && <p><b>Email:</b> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>}
      <p><b>Website:</b> <a href="https://otaga.in" target="_blank" rel="noopener">otaga.in</a></p>
      <p>ToolBox is a product of Otaga, made in India.</p>
    </LegalPage>
  );
}
