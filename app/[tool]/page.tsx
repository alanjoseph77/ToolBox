import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTool, tools } from "@/lib/tools";
import ToolRunner from "@/components/ToolRunner";

export const dynamicParams = false;
export const generateStaticParams = () => tools.map((t) => ({ tool: t.slug }));

export function generateMetadata({ params }: { params: { tool: string } }): Metadata {
  const t = getTool(params.tool);
  return t ? { title: t.name, description: t.description } : {};
}

export default function ToolPage({ params }: { params: { tool: string } }) {
  const t = getTool(params.tool);
  if (!t) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">{t.name}</h1>
      <p className="mt-2 mb-6 text-slate-600">{t.description}</p>
      <ToolRunner slug={t.slug} />
    </div>
  );
}
