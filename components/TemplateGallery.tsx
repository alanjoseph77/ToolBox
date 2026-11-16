"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EMPTY_PRODUCT, type Product } from "@/lib/product";
import { themeOf } from "@/lib/productThemes";
import { makePoster } from "@/lib/poster";
import { DEFAULT_STYLE, qrSvg, svgToPng } from "@/lib/qrStyle";
import { LAYOUTS, TEMPLATES, samplePhoto, type Template } from "@/lib/productTemplates";

/** Builds the real poster for a template (sample product, QR in the template's style), so the preview is exactly what you get. */
async function preview(t: Template): Promise<string> {
  const p: Product = { ...EMPTY_PRODUCT, ...t.product, theme: t.theme, image: samplePhoto(t, 500), whatsapp: "+919876543210", website: "www.yourshop.com" } as Product;
  const qr = qrSvg(`https://toolbox.otaga.in/p/${t.id.padEnd(8, "x").slice(0, 8)}`, { ...DEFAULT_STYLE, ...t.style, logo: "" });
  return URL.createObjectURL(await makePoster(p, await svgToPng(qr, 500), t.layout));
}

export default function TemplateGallery() {
  const [imgs, setImgs] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true; const urls: string[] = [];
    (async () => { for (const t of TEMPLATES) { try { const u = await preview(t); urls.push(u); if (!live) return; setImgs((o) => ({ ...o, [t.id]: u })); } catch { /* skip this preview */ } } })();
    return () => { live = false; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Poster layout">
        <button role="tab" aria-selected={filter === "all"} className={`chip ${filter === "all" ? "chip-active" : ""}`} onClick={() => setFilter("all")}>All designs</button>
        {LAYOUTS.map((l) => <button key={l.id} role="tab" aria-selected={filter === l.id} className={`chip ${filter === l.id ? "chip-active" : ""}`} onClick={() => setFilter(l.id)}>{l.name} layout</button>)}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="tpl-grid">
        {TEMPLATES.filter((t) => filter === "all" || t.layout === filter).map((t) => {
          const th = themeOf(t.theme);
          return (
            <li key={t.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white" data-testid={`tpl-${t.id}`}>
              <div className="flex aspect-[1080/1500] items-center justify-center bg-neutral-100">
                {imgs[t.id] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={imgs[t.id]} alt={`${t.name} poster design`} className="h-full w-full object-contain" /> : <div className="h-full w-full animate-pulse bg-neutral-100" />}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2"><div><h2 className="font-bold">{t.emoji} {t.name}</h2><p className="text-sm text-neutral-500">{t.tagline}</p></div>
                  <span className="mt-1 flex shrink-0 overflow-hidden rounded-full border" title={`${th.name} colours`}><span className="h-5 w-5" style={{ background: th.card }} /><span className="h-5 w-5" style={{ background: th.accent }} /></span></div>
                <p className="text-xs text-neutral-500">{th.name} colours · {LAYOUTS.find((l) => l.id === t.layout)?.name} layout · {t.style.body} QR dots</p>
                <Link href={`/product-qr?template=${t.id}`} className="btn mt-auto w-full" data-testid={`tpl-use-${t.id}`}>Use this template</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-neutral-500">You can change the colours, layout and QR style after you pick a template. The sample text is only a guide.</p>
    </div>
  );
}
