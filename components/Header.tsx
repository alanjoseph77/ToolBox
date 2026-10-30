import Link from "next/link";
import { Wrench } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Wrench className="h-5 w-5 text-brand-600" /> ToolBox
        </Link>
        <span className="hidden text-sm text-slate-500 sm:block">All your tools in one place · No signup · Private</span>
      </div>
    </header>
  );
}
