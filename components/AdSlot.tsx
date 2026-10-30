"use client";
import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT } from "@/lib/site";

declare global { interface Window { adsbygoogle?: unknown[] } }

/**
 * A labelled, space-reserving ad unit. Renders nothing unless both the AdSense publisher id and an
 * ad unit id are configured, so the site looks exactly the same until ads are approved.
 * Keep these away from upload buttons and tool controls (accidental clicks break AdSense policy).
 */
export default function AdSlot({ className = "" }: { className?: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT || pushed.current) return;
    pushed.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* blocked by an ad blocker */ }
  }, []);
  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return null;
  return (
    <aside aria-label="Advertisement" className={`my-10 ${className}`}>
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Advertisement</p>
      <div className="min-h-[120px]">
        <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    </aside>
  );
}
