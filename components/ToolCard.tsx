import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolMeta } from "@/lib/tools";
import ToolIcon from "./ToolIcon";

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link href={`/${tool.slug}`} className="card group flex items-start gap-3 p-4 transition hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-glow">
      <ToolIcon tool={tool} />
      <span className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug group-hover:text-brand-600">{tool.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{tool.description}</p>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 -translate-x-1 text-brand-600 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
    </Link>
  );
}
