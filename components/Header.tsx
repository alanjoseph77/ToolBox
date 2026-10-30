import Link from "next/link";
import { Box } from "lucide-react";
import { categories } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black"><Box className="h-5 w-5" aria-hidden /></span>
          ToolBox
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-neutral-600 md:flex">
          {categories.map((c) => [c, categorySeo[c].slug]).map(([l, id]) => (
            <Link key={id} href={`/tools/${id}`} className="rounded-lg px-3 py-2 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white">{l}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2"><CommandPalette /><ThemeToggle /></div>
      </div>
    </header>
  );
}
