import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using ToolBox by Otaga.",
  alternates: { canonical: `${SITE}/terms` },
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="30 October 2026">
      <p>By using ToolBox, a product of <a href="https://otaga.in" target="_blank" rel="noopener">Otaga</a>, you agree to these terms.</p>
      <h2>Using the tools</h2>
      <p>ToolBox is free to use. Use it only for lawful purposes and only with files and content you own or have permission to use. Do not use the tools to infringe anyone&apos;s rights.</p>
      <h2>Watermark remover</h2>
      <p>The watermark remover may only be used on images you own or are authorised to edit. You are responsible for having the right to modify any image you process.</p>
      <h2>No warranty</h2>
      <p>The tools are provided &ldquo;as is&rdquo; without warranties of any kind. Results can vary, for example on very large files or complex documents. Keep a copy of your originals. We are not liable for any loss or damage from using ToolBox.</p>
      <h2>Availability</h2>
      <p>We may change, suspend or remove tools at any time.</p>
      <h2>Changes</h2>
      <p>We may update these terms and will change the date above when we do. Continuing to use ToolBox means you accept the updated terms.</p>
    </LegalPage>
  );
}
