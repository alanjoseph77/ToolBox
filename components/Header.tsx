import Link from "next/link";
import { Box } from "lucide-react";
import { categories, tools } from "@/lib/tools";
import { categorySeo } from "@/lib/seo";
import CommandPalette from "./CommandPalette";
import { QR_SLUGS } from "@/lib/qrHub";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
        <MobileMenu items={(() => { const list = categories.map((c) => ({ label: c as string, href: `/tools/${categorySeo[c].slug}`, count: tools.filter((t) => t.category === c).length, isNew: c === "Share" }));
          list.splice(2, 0, { label: "QR codes", href: "/qr-codes", count: QR_SLUGS.length, isNew: false }); return list; })()} />
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black"><Box className="h-5 w-5" aria-hidden /></span>
          ToolBox
        </Link>
        </div>
        <nav className="hidden items-center gap-1 text-sm font-medium text-neutral-600 lg:flex">
          {(() => { const l: [string, string][] = categories.map((c) => [c, `/tools/${categorySeo[c].slug}`]); l.splice(2, 0, ["QR codes", "/qr-codes"]); return l; })().map(([l, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-2.5 py-2 lg:px-3 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white">{l}{l === "Share" && <span className="ml-1.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white dark:bg-white dark:text-black">New</span>}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2"><CommandPalette /><ThemeToggle /></div>
      </div>
    </header>
  );
}
