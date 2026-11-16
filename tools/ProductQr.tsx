"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QrStyler, { type LogoOption } from "@/components/QrStyler";
import EditLinkBox from "@/components/EditLinkBox";
import { download, loadImage } from "@/lib/files";
import { jpegWithinKb } from "@/lib/photoSize";
import { CURRENCIES, EMPTY_PRODUCT, cleanProduct, discount, packProduct, priceText, type Product } from "@/lib/product";
import { DEFAULT_STYLE, qrSvg, svgToPng, type QrStyle } from "@/lib/qrStyle";
import { makePoster } from "@/lib/poster";
import { THEMES } from "@/lib/productThemes";
import { LAYOUTS, TEMPLATES, samplePhoto, templateOf, type PosterLayout, type Template } from "@/lib/productTemplates";

interface Created { id: string; token: string; mode: "hosted" | "packed"; saved?: boolean }
const LS = "toolbox-product-qr-v1";
const SAMPLE_ID = "abcdefgh";                              // only used for the preview before the real link exists

/** Photo → small JPEG data URL (kept under ~150 KB so the page loads fast on mobile data). */
async function compress(file: Blob, max = 900, kb = 150): Promise<string> {
  const img = await loadImage(file); let k = Math.min(1, max / Math.max(img.width, img.height));
  for (let i = 0; i < 8; i++) {
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height);
    const r = await jpegWithinKb(c, kb); if (r.reached && r.quality >= 0.5) return blobUrl(r.blob); k *= 0.82;
  }
  throw new Error("photo");
}
const blobUrl = (b: Blob) => new Promise<string>((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.onerror = () => rej(new Error("read")); f.readAsDataURL(b); });
async function thumb(src: string, px = 160): Promise<string> {
  const img = new Image(); img.src = src; await img.decode(); const c = document.createElement("canvas"); c.width = c.height = px;
  const k = Math.max(px / img.width, px / img.height), w = img.width * k, h = img.height * k, g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, px, px); g.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}

export default function ProductQr() {
  const [p, setP] = useState<Product>(EMPTY_PRODUCT);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [shopLogo, setShopLogo] = useState("");
  const [thumbP, setThumbP] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [packed, setPacked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [origin, setOrigin] = useState("https://toolbox.otaga.in");
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<PosterLayout>("classic");
  const [sample, setSample] = useState("");                       // name of the template whose sample content is still in the form
  const [posterUrl, setPosterUrl] = useState("");
  const photo = useRef<HTMLInputElement>(null);
  const lastPoster = useRef("");

  useEffect(() => {
    setOrigin(location.origin);
    try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s) { if (s.p) setP({ ...EMPTY_PRODUCT, ...s.p }); if (s.style) setStyle({ ...DEFAULT_STYLE, ...s.style, logo: "" }); if (s.shopLogo) setShopLogo(s.shopLogo); if (s.created) setCreated(s.created); if (s.layout) setLayout(s.layout); } } catch { /* nothing saved */ }
    const q = new URLSearchParams(location.search), eid = q.get("edit"), ekey = q.get("key");
    if (eid && ekey) {                                                         // the private edit link: open this page for editing from any phone
      fetch(`/api/product?id=${encodeURIComponent(eid)}&key=${encodeURIComponent(ekey)}`, { cache: "no-store" }).then(async (r) => { const j = await r.json().catch(() => ({})); if (r.ok) { setP({ ...EMPTY_PRODUCT, ...j.product }); setCreated({ id: eid, token: ekey, mode: "hosted", saved: true }); } else setError(j.error || "That edit link did not work."); }).catch(() => setError("Could not open the edit link."));
    } else { const t = templateOf(q.get("template")); if (t) applyTemplate(t, true); }
    setReady(true);
  }, []);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(LS, JSON.stringify({ p, style: { ...style, logo: "" }, shopLogo, created, layout })); } catch { /* storage full or off */ } }, [p, style, shopLogo, created, layout, ready]);
  useEffect(() => { if (p.image) thumb(p.image).then(setThumbP).catch(() => setThumbP("")); else setThumbP(""); }, [p.image]);
  useEffect(() => { if (created?.mode !== "packed") return; let live = true; packProduct(p).then((s) => live && setPacked(s)); return () => { live = false; }; }, [created?.mode, p]);

  const text = created ? (created.mode === "packed" ? `${origin}/p/q#${packed}` : `${origin}/p/${created.id}`) : `${origin}/p/${SAMPLE_ID}`;
  const pageUrl = created ? (created.mode === "packed" ? text : `${origin}/p/${created.id}`) : "";
  const ecc = created?.mode === "packed" ? "M" : "H";
  const logos: LogoOption[] = useMemo(() => [...(thumbP ? [{ key: "photo", label: "Product photo", src: thumbP }] : []), ...(shopLogo ? [{ key: "shop", label: "Shop logo", src: shopLogo }] : [])], [thumbP, shopLogo]);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((o) => ({ ...o, [k]: v }));
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 3000); };

  /** Takes over a template's look. Its sample text and picture are added only if the form is still empty. */
  const applyTemplate = (t: Template, fromLink = false) => {
    setStyle({ ...DEFAULT_STYLE, ...t.style, logo: "" }); setLayout(t.layout);
    let saved: { p?: Product } | null = null; try { saved = JSON.parse(localStorage.getItem(LS) || "null"); } catch { /* none */ }
    const hasContent = fromLink ? !!saved?.p?.name : !!p.name.trim();        // from a link the form has not loaded yet, so look at the saved draft
    if (!hasContent) { setP({ ...EMPTY_PRODUCT, ...t.product, theme: t.theme, image: samplePhoto(t) } as Product); setSample(t.name); }
    else { setP((o) => ({ ...o, theme: t.theme })); setSample(""); }
    if (!fromLink) flash(hasContent ? `Applied the ${t.name} look. Your text is unchanged.` : `Loaded the ${t.name} sample. Replace it with your own product.`);
  };
  const clearSample = () => { setP({ ...EMPTY_PRODUCT, theme: p.theme }); setSample(""); };

  const api = useCallback(async (method: string, body: unknown) => {
    const r = await fetch("/api/product", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), j = await r.json().catch(() => ({}));
    return { status: r.status, ok: r.ok, j };
  }, []);

  const pickPhoto = async (f?: File) => { if (!f) return; setError(""); try { set("image", await compress(f)); } catch { setError("Could not use that photo. Try another one."); } };
  const pickLogo = async (f?: File) => { if (!f) return; try { setShopLogo(await thumb(await blobUrl(f), 200)); } catch { setError("Could not use that logo."); } };

  const create = async () => {
    setError("");
    const c = cleanProduct(p); if (!c.ok) { setError(c.error); return; }
    if (sample && templateOf(TEMPLATES.find((t) => t.name === sample)?.id)?.product.name === p.name && !window.confirm("This still has the sample product from the template. Create the QR code anyway?")) return;
    setBusy(true);
    try {
      const r = await api("POST", { product: c.p });
      if (r.ok) { setCreated({ id: r.j.id, token: r.j.token, mode: "hosted" }); flash("Your product page is live."); }
      else if (r.status === 503) { setCreated({ id: "", token: "", mode: "packed" }); flash("Storage is not switched on, so the details are packed inside the QR code (no photo)."); }
      else setError(r.j.error || "Could not create the page.");
    } catch { setError("Could not reach the server. Check your internet and try again."); }
    setBusy(false);
  };
  const update = async () => {
    if (!created || created.mode !== "hosted") return; setError("");
    const c = cleanProduct(p); if (!c.ok) { setError(c.error); return; }
    setBusy(true); const r = await api("PUT", { id: created.id, token: created.token, product: c.p }).catch(() => null); setBusy(false);
    if (r?.ok) flash("Updated. The same QR code now shows the new details."); else setError(r?.j?.error || "Could not update the page.");
  };
  const remove = async () => {
    if (!created) return; setBusy(true);
    if (created.mode === "hosted") await api("DELETE", { id: created.id, token: created.token }).catch(() => null);
    setBusy(false); setCreated(null); flash("Deleted. The old QR code no longer works.");
  };
  const reset = () => { setP(EMPTY_PRODUCT); setCreated(null); setError(""); };

  const qr = useMemo(() => qrSvg(text, style, ecc), [text, style, ecc]);
  useEffect(() => {                                                   // small live preview of the poster
    if (!ready) return; let live = true, url = "";   // eslint-disable-line prefer-const
    const t = setTimeout(async () => { try { const b = await makePoster(p, await svgToPng(qr, 900), layout); if (live) { url = URL.createObjectURL(b); if (lastPoster.current) URL.revokeObjectURL(lastPoster.current); lastPoster.current = url; setPosterUrl(url); } } catch { /* preview only */ } }, 700);
    return () => { live = false; clearTimeout(t); };
  }, [p, qr, layout, ready]);
  const png = async () => download(await svgToPng(qr, 1400), `${(p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-qr.png`, "image/png", false);
  const svgDl = () => download(new Blob([qr.svg], { type: "image/svg+xml" }), `${(p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-qr.svg`, "image/svg+xml", false);
  const poster = async () => { try { download(await makePoster(p, await svgToPng(qr, 900), layout), "product-poster.png", "image/png", false); } catch { setError("Could not make the poster."); } };
  const copy = (t: string, m: string) => { navigator.clipboard?.writeText(t).then(() => flash(m)).catch(() => flash("Could not copy.")); };

  const f = (label: string, id: string, el: React.ReactNode, hint?: string) => <div><label className="label" htmlFor={id}>{label}</label>{el}{hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}</div>;
  const inp = (id: string, k: keyof Product, ph = "", type = "text", extra: Record<string, unknown> = {}) => <input id={id} data-testid={`pq-${id}`} type={type} className="input" value={String(p[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value as never)} {...extra} />;
  const card = "space-y-4 rounded-2xl border bg-white p-4 sm:p-5";

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="text-lg font-bold">1. Product</h2>
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="label">Photo</p>
            {p.image ? (
              <div className="space-y-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="Product" data-testid="pq-photo" className="h-36 w-36 rounded-xl border object-cover" />
                <div className="flex gap-2"><button className="btn-ghost !py-1.5 text-sm" onClick={() => photo.current?.click()}>Change</button><button className="btn-ghost !py-1.5 text-sm" onClick={() => set("image", "")}>Remove</button></div></div>
            ) : <button className="flex h-36 w-36 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 text-center text-sm text-neutral-500" onClick={() => photo.current?.click()}><span className="text-2xl">＋</span>Add photo</button>}
            <input ref={photo} data-testid="pq-photo-input" type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <div className="min-w-[220px] flex-1 space-y-4">
            {f("Product name *", "name", inp("name", "name", "e.g. Handmade cotton kurti", "text", { maxLength: 90 }))}
            <div className="grid grid-cols-[96px_1fr_1fr] gap-3">
              {f("Currency", "currency", <select id="currency" className="input" value={p.currency} onChange={(e) => set("currency", e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>)}
              {f("Price", "price", inp("price", "price", "499", "text", { inputMode: "decimal" }))}
              {f("Old price (optional)", "mrp", inp("mrp", "mrp", "799", "text", { inputMode: "decimal" }))}
            </div>
          </div>
        </div>
        {f("Description", "desc", <textarea id="desc" data-testid="pq-desc" className="input h-28" maxLength={1200} value={p.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Material, sizes, colours, delivery, offers…" />)}
        <div className="grid gap-3 sm:grid-cols-2">
          {f("Availability", "stock", <select id="stock" className="input" value={p.stock} onChange={(e) => set("stock", e.target.value as Product["stock"])}><option value="in">In stock</option><option value="limited">Few left</option><option value="out">Out of stock</option><option value="">Do not show</option></select>)}
          {f("Offer tag (optional)", "offer", inp("offer", "offer", "e.g. Festival sale, Free delivery", "text", { maxLength: 80 }))}
        </div>
        <div>
          <p className="label">More details (optional)</p>
          {p.extra.map((e, i) => (
            <div key={i} className="mb-2 flex gap-2"><input aria-label={`Detail ${i + 1} name`} className="input" placeholder="Size" value={e.k} onChange={(ev) => set("extra", p.extra.map((x, j) => (j === i ? { ...x, k: ev.target.value } : x)))} /><input aria-label={`Detail ${i + 1} value`} className="input" placeholder="S, M, L, XL" value={e.v} onChange={(ev) => set("extra", p.extra.map((x, j) => (j === i ? { ...x, v: ev.target.value } : x)))} /><button className="btn-ghost !px-3" aria-label="Remove detail" onClick={() => set("extra", p.extra.filter((_, j) => j !== i))}>✕</button></div>
          ))}
          {p.extra.length < 5 && <button className="btn-ghost !py-1.5 text-sm" onClick={() => set("extra", [...p.extra, { k: "", v: "" }])}>+ Add a detail</button>}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">2. Shop and contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {f("Shop name", "shop", inp("shop", "shop", "Your shop name", "text", { maxLength: 70 }))}
          {f("Website or product link", "website", inp("website", "website", "www.myshop.com", "url"))}
          {f("WhatsApp number", "whatsapp", inp("whatsapp", "whatsapp", "+91 98765 43210", "tel"), "Shows an Order on WhatsApp button with the product already typed in.")}
          {f("Phone number", "phone", inp("phone", "phone", "+91 98765 43210", "tel"))}
          {f("UPI ID", "upi", inp("upi", "upi", "myshop@upi"), "Adds a Pay with UPI button with the price filled in.")}
          {f("Instagram", "instagram", inp("instagram", "instagram", "@myshop"))}
          {f("Email", "email", inp("email", "email", "shop@example.com", "email"))}
          {f("Shop logo (optional)", "logo", <div className="flex items-center gap-3">{shopLogo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={shopLogo} alt="Shop logo" className="h-11 w-11 rounded-lg border object-cover" />}<label className="btn-ghost cursor-pointer !py-1.5 text-sm">{shopLogo ? "Change" : "Add logo"}<input type="file" accept="image/*" hidden onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} /></label>{shopLogo && <button className="btn-ghost !py-1.5 text-sm" onClick={() => setShopLogo("")}>Remove</button>}</div>, "Only used in the middle of the QR code.")}
        </div>
        {f("Shop address", "address", <textarea id="address" data-testid="pq-address" className="input h-20" maxLength={200} value={p.address} onChange={(e) => set("address", e.target.value)} placeholder="Shop number, street, city" />, "Adds a Get directions button.")}
      </section>

      <section className={card} data-testid="pq-design">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">3. Pick a design</h2><a href="/product-qr/templates" className="text-sm font-medium underline" data-testid="pq-all-templates">See all templates with previews →</a></div>
        {sample && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" data-testid="pq-sample"><span>You are using the <b>{sample}</b> sample. Replace the text and photo with your own product.</span><button className="btn-ghost !py-1.5" onClick={clearSample}>Clear the sample</button></div>}
        <div><p className="mb-2 text-sm font-medium">Start from a template</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{TEMPLATES.map((t) => <button key={t.id} data-testid={`pq-tpl-${t.id}`} className="chip shrink-0" onClick={() => applyTemplate(t)}><span aria-hidden>{t.emoji}</span>{t.name}</button>)}</div></div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-4">
            <div><p className="mb-2 text-sm font-medium">Colours of your product page and poster</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour theme">{THEMES.map((t) => (
                <button key={t.id} role="radio" aria-checked={p.theme === t.id} data-testid={`pq-theme-${t.id}`} onClick={() => set("theme", t.id)} className={`flex min-h-[44px] items-center gap-2 rounded-full border px-3 py-2 text-sm ${p.theme === t.id ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-300"}`}>
                  <span className="flex h-5 w-5 overflow-hidden rounded-full border"><span className="h-full w-1/2" style={{ background: t.card }} /><span className="h-full w-1/2" style={{ background: t.accent }} /></span>{t.name}</button>))}</div></div>
            <div><p className="mb-2 text-sm font-medium">Poster layout</p>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Poster layout">{LAYOUTS.map((l) => (
                <button key={l.id} role="radio" aria-checked={layout === l.id} data-testid={`pq-layout-${l.id}`} onClick={() => setLayout(l.id)} className={`rounded-xl border p-3 text-left text-sm ${layout === l.id ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-300"}`}><b>{l.name}</b><span className="mt-0.5 block text-xs text-neutral-500">{l.hint}</span></button>))}</div></div>
          </div>
          <div className="order-first md:order-last">{posterUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={posterUrl} alt="Poster preview" data-testid="pq-poster-prev" className="mx-auto w-full max-w-[170px] rounded-xl border shadow-sm md:max-w-[220px]" /> : <div className="mx-auto h-[300px] w-[220px] animate-pulse rounded-xl bg-neutral-100" />}
            <p className="mt-1 text-center text-xs text-neutral-500">Poster preview</p></div>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">4. Style your QR code</h2>
        <QrStyler text={text} style={style} onChange={setStyle} logos={logos} ecc={ecc} />
      </section>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="pq-error">{error}</p>}
      {note && <p className="text-sm text-green-700" aria-live="polite" data-testid="pq-note">{note}</p>}

      {!created ? (
        <div className="sticky bottom-3 z-30 rounded-2xl bg-white/70 p-1 shadow-lg backdrop-blur"><button className="btn w-full" disabled={busy || !p.name.trim()} onClick={create} data-testid="pq-create">{busy ? "Creating…" : "Create my QR code"}</button></div>
      ) : (
        <section className={`${card} border-neutral-900`} data-testid="pq-done">
          <h2 className="text-lg font-bold">5. Your QR code is ready</h2>
          {created.mode === "packed" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This QR code holds the details itself, so it has no photo and is denser. When the site owner switches on storage, create it again to include the photo.</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={png} data-testid="pq-dl-png">Download PNG</button>
            <button className="btn-ghost" onClick={svgDl} data-testid="pq-dl-svg">Download SVG (for print shops)</button>
            <button className="btn-ghost" onClick={poster} data-testid="pq-dl-poster">Download poster</button>
          </div>
          <div className="space-y-2 text-sm"><p className="font-medium">Your product page</p>
            <div className="flex gap-2"><input readOnly aria-label="Product page link" data-testid="pq-link" className="input text-xs" value={created.mode === "packed" ? `${origin}/p/q#…` : pageUrl} /><button className="btn-ghost" onClick={() => copy(pageUrl, "Link copied.")}>Copy</button><a className="btn-ghost" href={pageUrl} target="_blank" rel="noreferrer" data-testid="pq-open">Open</a></div></div>
          {created.mode === "hosted" && <EditLinkBox prefix="pq" editUrl={`${origin}/product-qr?edit=${created.id}&key=${created.token}`} pageUrl={pageUrl} title={p.name || "Product"} saved={!!created.saved} onSaved={() => setCreated((c) => (c ? { ...c, saved: true } : c))} />}
          <div className="flex flex-wrap gap-2 border-t pt-3">
            {created.mode === "hosted" && <button className="btn" disabled={busy} onClick={update} data-testid="pq-update">Save changes to this page</button>}
            <button className="btn-ghost" disabled={busy} onClick={() => { if (!created || created.saved || created.mode === "packed" || window.confirm("You have not saved your private edit link yet. Without it you cannot edit or delete this page later. Start a new product anyway?")) reset(); }}>New product</button>
            <button className="btn-ghost text-red-700" disabled={busy} onClick={remove}>Delete this page</button>
          </div>
          <p className="text-xs text-neutral-500">Change the price or photo any time with <b>Save changes</b>: the printed QR code stays the same. The page stays online for a year and renews each time you save.</p>
        </section>
      )}
      <p className="text-xs text-neutral-500">Your product details and photo are stored on our server so customers can open the page. We never see payments: the UPI button opens the customer&apos;s own app. Only the browser that created a page can change or delete it.</p>
    </div>
  );
}
