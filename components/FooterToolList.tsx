"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

/** One footer column. On a phone it starts closed so the footer is short; on a larger screen it is always open. */
export default function FooterToolList({ title, href, tools }: { title: string; href: string; tools: { slug: string; name: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (ref.current && window.matchMedia("(max-width: 767px)").matches) ref.current.open = false; }, []);
  return (
    <details ref={ref} open className="group border-b border-neutral-200 py-1 md:border-0 md:py-0 dark:border-neutral-800">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-sm font-semibold md:pointer-events-none md:min-h-0 md:cursor-default md:pb-2 [&::-webkit-details-marker]:hidden"
        onClick={(e) => { if (window.matchMedia("(min-width: 768px)").matches) e.preventDefault(); }}>
        <Link href={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>{title}</Link>
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180 md:hidden" aria-hidden />
      </summary>
      <ul className="space-y-1 pb-3 text-sm text-neutral-500 md:space-y-1.5 md:pb-0">
        {tools.map((t) => <li key={t.slug}><Link href={`/${t.slug}`} className="inline-block py-1.5 hover:text-black md:py-0 dark:hover:text-white">{t.name}</Link></li>)}
      </ul>
    </details>
  );
}
