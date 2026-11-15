"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, ChevronRight, Home, LayoutGrid, Menu, X } from "lucide-react";

export interface MenuItem { label: string; href: string; count: number; isNew?: boolean }

const EXTRA: [string, string][] = [["Blog", "/blog"], ["About us", "/about"], ["Contact us", "/contact"], ["Privacy policy", "/privacy"]];

// The phone menu: a sidebar that slides in from the left. It is drawn in <body> because the sticky header
// has a blur effect, which would otherwise trap a full-screen panel inside the header's own box.
export default function MobileMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  const btn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);                                   // going to a page closes the menu
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";   // the page behind does not scroll
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc); closeBtn.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); btn.current?.focus(); };
  }, [open]);

  const row = "flex min-h-[48px] items-center justify-between rounded-xl px-3 text-[15px] font-medium text-neutral-800 active:bg-neutral-100 dark:text-neutral-100 dark:active:bg-neutral-900";
  return (
    <>
      <button ref={btn} type="button" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu" data-testid="menu-open" onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 md:hidden dark:border-neutral-800 dark:text-white"><Menu className="h-5 w-5" aria-hidden /></button>
      {mounted && createPortal(
        <div className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
          <div onClick={() => setOpen(false)} data-testid="menu-overlay" className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
          <aside id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" data-testid="menu-panel"
            className={`absolute left-0 top-0 flex h-full w-[84%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-neutral-950 ${open ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black"><Box className="h-5 w-5" aria-hidden /></span>ToolBox
              </Link>
              <button ref={closeBtn} type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-700 dark:text-neutral-200"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Sections">
              <Link href="/" className={row}><span className="flex items-center gap-3"><Home className="h-4 w-4 text-neutral-500" aria-hidden />Home</span></Link>
              <Link href="/#all" className={row}><span className="flex items-center gap-3"><LayoutGrid className="h-4 w-4 text-neutral-500" aria-hidden />All tools</span></Link>
              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Sections</p>
              {items.map((i) => (
                <Link key={i.href} href={i.href} data-testid="menu-item" className={`${row} ${path === i.href ? "bg-neutral-100 dark:bg-neutral-900" : ""}`}>
                  <span className="flex items-center gap-2">{i.label}{i.isNew && <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white dark:bg-white dark:text-black">New</span>}</span>
                  <span className="flex items-center gap-1 text-sm text-neutral-500">{i.count}<ChevronRight className="h-4 w-4" aria-hidden /></span>
                </Link>
              ))}
              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">More</p>
              {EXTRA.map(([l, h]) => <Link key={h} href={h} className={`${row} text-neutral-600 dark:text-neutral-300`}>{l}</Link>)}
            </nav>
            <p className="border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800">Free, private and built for your phone.</p>
          </aside>
        </div>, document.body)}
    </>
  );
}
