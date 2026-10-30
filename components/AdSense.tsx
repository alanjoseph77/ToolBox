"use client";
import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/site";

/** Loads the AdSense script once, only when a publisher id is configured. */
export default function AdSense() {
  if (!ADSENSE_CLIENT) return null;
  return <Script id="adsense" async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} />;
}
