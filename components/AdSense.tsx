import { ADSENSE_CLIENT } from "@/lib/site";

/**
 * AdSense loader, rendered into the server HTML <head> so Google's site verification can see it.
 * Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is set.
 */
export default function AdSense() {
  if (!ADSENSE_CLIENT) return null;
  // eslint-disable-next-line @next/next/no-sync-scripts
  return <script async crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} />;
}
