import Link from "next/link";
import { Box } from "lucide-react";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#05060f]/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow"><Box className="h-5 w-5" aria-hidden /></span>
          ToolBox
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          {[["PDF", "pdf"], ["Image", "image"], ["Video", "video"], ["AI", "ai"], ["Developer", "developer"], ["Utility", "utility"]].map(([l, id]) => (
            <Link key={id} href={`/#${id}`} className="rounded-lg px-3 py-2 hover:bg-white/60 hover:text-brand-700 dark:hover:bg-white/10 dark:hover:text-white">{l}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2"><CommandPalette /><ThemeToggle /></div>
      </div>
    </header>
  );
}
