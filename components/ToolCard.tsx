import Link from "next/link";
import type { ToolMeta } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link href={`/${tool.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md">
      <h3 className="font-semibold group-hover:text-brand-600">{tool.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
    </Link>
  );
}
