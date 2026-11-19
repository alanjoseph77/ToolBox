"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { tools } from "@/lib/tools";
import { clearRecent, getRecent } from "@/lib/recent";
import ToolIcon from "./ToolIcon";

/** The last tools this person used (kept in their own browser). Shows nothing for first-time visitors. */
export default function RecentTools() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(getRecent()), []);
  const list = recent.map((s) => tools.find((t) => t.slug === s)).filter((t): t is (typeof tools)[number] => !!t).slice(0, 4);
  if (!list.length) return null;
  return (
    <section aria-labelledby="recent" className="mt-10" data-testid="recent">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="recent" className="flex items-center gap-2 text-lg font-bold"><Clock className="h-4 w-4 text-neutral-400" /> Recently used</h2>
        <button onClick={() => { clearRecent(); setRecent([]); }} className="flex min-h-[44px] items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"><X className="h-3 w-3" /> Clear</button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {list.map((t) => (
          <Link key={t.slug} href={`/${t.slug}`} className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-sm font-semibold leading-snug hover:border-neutral-900 dark:border-neutral-800 dark:hover:border-white">
            <ToolIcon tool={t} /><span className="min-w-0">{t.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
