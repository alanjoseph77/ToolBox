"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, Phone, Globe, Mail, MessageCircle, Share2, IndianRupee, AtSign, Flag } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";
import { actions, discount, priceText, unpackProduct, type Product } from "@/lib/product";

const ICONS: Record<string, typeof Phone> = { wa: MessageCircle, call: Phone, upi: IndianRupee, web: Globe, map: MapPin, ig: AtSign, mail: Mail };
const STOCK = { in: ["In stock", "bg-green-100 text-green-800"], limited: ["Few left", "bg-amber-100 text-amber-800"], out: ["Out of stock", "bg-red-100 text-red-800"] } as const;

export default function ProductView({ id }: { id: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(location.href);
    (async () => {
      try {
        if (id === "q") { const x = await unpackProduct(location.hash.slice(1)); if (x) setP(x); else setError("This QR code could not be read. Ask the shop for a new one."); return; }
        const r = await fetch(`/api/product?id=${encodeURIComponent(id)}`, { cache: "no-store" }), j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Could not load this page."); setP(j.product);
      } catch (e) { setError(e instanceof Error ? e.message : "Could not load this page."); }
    })();
  }, [id]);

  if (error) return <div className="rounded-2xl border bg-white p-6 text-center" role="alert" data-testid="pv-error"><p className="font-semibold">Product not available</p><p className="mt-1 text-sm text-neutral-600">{error}</p></div>;
  if (!p) return <p className="py-20 text-center text-sm text-neutral-500">Loading…</p>;
  const off = discount(p), st = p.stock ? STOCK[p.stock] : null, acts = actions(p, url);
  const share = () => { const d = { title: p.name, text: `${p.name}${p.price ? " – " + priceText(p) : ""}`, url }; if (navigator.share) navigator.share(d).catch(() => {}); else navigator.clipboard?.writeText(url); };

  return (
    <article className="overflow-hidden rounded-3xl border bg-white shadow-sm" data-testid="pv">
      {p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" data-testid="pv-img" />}
      <div className="space-y-4 p-5">
        {p.shop && <p className="text-sm font-medium text-neutral-500" data-testid="pv-shop">{p.shop}</p>}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {st && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st[1]}`}>{st[0]}</span>}
            {p.offer && <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white" data-testid="pv-offer">{p.offer}</span>}
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight" data-testid="pv-name">{p.name}</h1>
          {p.price && (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold" data-testid="pv-price">{priceText(p)}</span>
              {p.mrp && <span className="text-lg text-neutral-400 line-through">{priceText(p, p.mrp)}</span>}
              {off > 0 && <span className="text-sm font-bold text-green-700" data-testid="pv-off">{off}% off</span>}
            </p>
          )}
        </div>
        {p.desc && <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700" data-testid="pv-desc">{p.desc}</p>}
        {p.extra.length > 0 && (
          <dl className="divide-y rounded-xl border text-sm">{p.extra.map((e, i) => <div key={i} className="flex justify-between gap-4 px-3 py-2"><dt className="text-neutral-500">{e.k}</dt><dd className="text-right font-medium">{e.v}</dd></div>)}</dl>
        )}
        <div className="grid gap-2" data-testid="pv-actions">
          {acts.map((a) => {
            const I = ICONS[a.key] ?? Globe;
            return <a key={a.key} href={a.href} data-key={a.key} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer nofollow" className={`${a.primary ? "btn" : "btn-ghost"} w-full`}><I className="h-4 w-4" aria-hidden />{a.label}</a>;
          })}
          <button className="btn-ghost w-full" onClick={share}><Share2 className="h-4 w-4" aria-hidden />Share this product</button>
        </div>
        {p.address && <p className="flex gap-2 text-sm text-neutral-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{p.address}</p>}
      </div>
      <div className="border-t bg-neutral-50 px-5 py-3 text-xs leading-relaxed text-neutral-500">
        <p className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Made by the seller with ToolBox. ToolBox does not sell this item, take payments or check sellers. Confirm details and the payee name before you pay.</p>
        <a className="mt-1 inline-flex items-center gap-1 underline" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Report product page " + id)}&body=${encodeURIComponent(url)}`}><Flag className="h-3 w-3" aria-hidden />Report this page</a>
      </div>
    </article>
  );
}
