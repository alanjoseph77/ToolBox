import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div>
          <div className="space-y-2 pb-4 sm:pb-0">
            <p className="text-lg font-extrabold">ToolBox</p>
            <p className="text-sm text-neutral-500">All your tools in one place. Free, private and built for your phone.</p>
            <p className="text-sm font-medium">An <a href="https://otaga.in" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-black dark:hover:text-white">Otaga</a> product</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white"><ShieldCheck className="h-4 w-4" /> Your files stay on your device</p>
          </div>
        </div>
        <nav aria-label="Site" className="mt-8 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-8 text-sm sm:grid-cols-4 dark:border-neutral-800">
          {([
            ["Product", [["Home", "/"], ["Features", "/features"], ["Pricing", "/pricing"], ["All tools", "/tools"], ["FAQ", "/faq"]]],
            ["Sections", [["PDF tools", "/tools/pdf"], ["Image tools", "/tools/image"], ["QR codes", "/qr-codes"], ["Video tools", "/tools/video"], ["Audio tools", "/tools/audio"], ["Share tools", "/tools/share"], ["Developer tools", "/tools/developer"], ["Utility tools", "/tools/utility"]]],
            ["Legal", [["Privacy policy", "/privacy"], ["Terms & conditions", "/terms"], ["Cookies", "/cookies"]]],
            ["Company", [["About us", "/about"], ["Contact us", "/contact"], ["Blog", "/blog"], ["Press", "/press"]]],
          ] as [string, string[][]][]).map(([h, links]) => (
            <div key={h}>
              <p className="mb-2 font-semibold">{h}</p>
              <ul className="space-y-1.5 text-neutral-500">{links.map(([l, href]) => <li key={href}><Link href={href} className="hover:text-black dark:hover:text-white">{l}</Link></li>)}</ul>
            </div>
          ))}
        </nav>
        <p className="mt-6 text-center text-xs text-neutral-400">© {new Date().getFullYear()} ToolBox · Made by <a href="https://otaga.in" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white">Otaga</a> · Made in India 🇮🇳</p>
      </div>
    </footer>
  );
}
