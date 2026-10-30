import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { categories, tools } from "@/lib/tools";
import { categoryStyle } from "@/lib/icons";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-lg font-extrabold">ToolBox</p>
            <p className="text-sm text-neutral-500">All your tools in one place. Free, private and built for your phone.</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white"><ShieldCheck className="h-4 w-4" /> Your files stay on your device</p>
          </div>
          {categories.slice(0, 3).map((c) => (
            <div key={c}>
              <p className="mb-2 text-sm font-semibold">{categoryStyle[c].label}</p>
              <ul className="space-y-1.5 text-sm text-neutral-500">
                {tools.filter((t) => t.category === c).slice(0, 5).map((t) => <li key={t.slug}><Link href={`/${t.slug}`} className="hover:text-black dark:hover:text-white">{t.name}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400 dark:border-neutral-800">© {new Date().getFullYear()} ToolBox · Made in India 🇮🇳</p>
      </div>
    </footer>
  );
}
