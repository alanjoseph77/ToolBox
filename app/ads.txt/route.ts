import { ADSENSE_CLIENT } from "@/lib/site";

// AdSense requires /ads.txt to list your publisher id. Empty until ads are configured.
export function GET() {
  const pub = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "# No advertising configured\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
