"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MONETAG_ON_TOOLS, MONETAG_SRC, MONETAG_ZONE } from "@/lib/site";

declare global { interface Window { __monetag?: boolean } }

/** Home and category pages only (unless NEXT_PUBLIC_MONETAG_ON_TOOLS=true). */
const allowed = (path: string) => MONETAG_ON_TOOLS || path === "/" || path.startsWith("/tools/");

export default function Monetag() {
  const path = usePathname();

  // Inject the Monetag script once, the first time an allowed page is shown.
  useEffect(() => {
    if (!MONETAG_ZONE || window.__monetag || !allowed(path) || /ToolBoxApp/.test(navigator.userAgent)) return; // never inside the mobile app
    window.__monetag = true;
    const s = document.createElement("script");
    s.dataset.zone = MONETAG_ZONE;
    s.src = MONETAG_SRC;
    (document.body || document.documentElement).appendChild(s);
  }, [path]);

  // A loaded ad script cannot be removed, so leaving for a tool page does a full page load instead.
  useEffect(() => {
    if (!MONETAG_ZONE || MONETAG_ON_TOOLS) return;
    const onClick = (e: MouseEvent) => {
      if (!window.__monetag || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== location.origin) return;
      if (!allowed(a.pathname) && a.pathname !== location.pathname) { e.preventDefault(); e.stopPropagation(); location.assign(a.href); }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
