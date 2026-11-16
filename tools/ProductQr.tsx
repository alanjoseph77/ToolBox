"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QrStyler, { type LogoOption } from "@/components/QrStyler";
import { download, loadImage } from "@/lib/files";
import { jpegWithinKb } from "@/lib/photoSize";
import { CURRENCIES, EMPTY_PRODUCT, cleanProduct, discount, packProduct, priceText, type Product } from "@/lib/product";
import { DEFAULT_STYLE, qrSvg, svgToPng, type QrStyle } from "@/lib/qrStyle";

interface Created { id: string; token: string; mode: "hosted" | "packed" }
const LS = "toolbox-product-qr-v1";
const SAMPLE_ID = "k7f2m9xa";

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

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/), lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"; }
  return lines;
}

/** A printable / WhatsApp-ready poster: photo, name, price, QR code and shop contact. */
async function makePoster(p: Product, qrPng: Blob): Promise<Blob> {
  const W = 1080, H = 1500, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  const font = (w: number, s: number) => `${w} ${s}px Inter, Arial, Helvetica, sans-serif`;
  let y = 70; g.textBaseline = "alphabetic"; g.textAlign = "center";
  if (p.shop) { g.fillStyle = "#525252"; g.font = font(700, 40); g.fillText(p.shop.slice(0, 40).toUpperCase(), W / 2, y + 30); y += 70; }
  if (p.image) {
    const img = new Image(); img.src = p.image; await img.decode(); const bw = 880, bh = 560, x = (W - bw) / 2, k = Math.max(bw / img.width, bh / img.height);
    g.save(); g.beginPath(); g.roundRect(x, y, bw, bh, 36); g.clip(); g.drawImage(img, x + (bw - img.width * k) / 2, y + (bh - img.height * k) / 2, img.width * k, img.height * k); g.restore(); y += bh + 50;
  } else y += 20;
  g.fillStyle = "#0a0a0a"; g.font = font(800, 62); const nl = wrap(g, p.name, 900, 2); nl.forEach((l, i) => g.fillText(l, W / 2, y + 56 + i * 70)); y += nl.length * 70 + 20;
  if (p.price) {
    g.font = font(800, 84); const pt = priceText(p), pw = g.measureText(pt).width; let mw = 0, mt = "";
    if (p.mrp) { g.font = font(500, 44); mt = priceText(p, p.mrp); mw = g.measureText(mt).width + 28; }
    const x0 = (W - pw - mw) / 2; g.textAlign = "left"; g.fillStyle = "#0a0a0a"; g.font = font(800, 84); g.fillText(pt, x0, y + 80);
    if (p.mrp) { g.font = font(500, 44); g.fillStyle = "#9ca3af"; g.fillText(mt, x0 + pw + 28, y + 80); g.fillRect(x0 + pw + 28, y + 64, g.measureText(mt).width, 3); }
    g.textAlign = "center"; y += 110;
    const off = discount(p); if (off > 0 || p.offer) { const t = p.offer || `${off}% OFF`; g.font = font(800, 38); const w = g.measureText(t).width + 56; g.fillStyle = "#0a0a0a"; g.beginPath(); g.roundRect((W - w) / 2, y, w, 66, 33); g.fill(); g.fillStyle = "#fff"; g.fillText(t, W / 2, y + 46); y += 90; }
  }
  const q = new Image(); q.src = URL.createObjectURL(qrPng); await q.decode();
  const qs = Math.min(520, H - y - 190), qw = qs * (q.width / q.height); g.drawImage(q, (W - qw) / 2, H - 150 - qs, qw, qs);
  g.fillStyle = "#525252"; g.font = font(600, 34); const line = [p.whatsapp || p.phone, p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")].filter(Boolean).join("   •   ");
  g.fillText(line.slice(0, 60), W / 2, H - 80); g.fillStyle = "#a3a3a3"; g.font = font(500, 26); g.fillText("Made with ToolBox · toolbox.otaga.in", W / 2, H - 36);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
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
  const photo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(location.origin);
    try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s) { if (s.p) setP({ ...EMPTY_PRODUCT, ...s.p }); if (s.style) setStyle({ ...DEFAULT_STYLE, ...s.style, logo: "" }); if (s.shopLogo) setShopLogo(s.shopLogo); if (s.created) setCreated(s.created); } } catch { /* nothing saved */ }
    setReady(true);
  }, []);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(LS, JSON.stringify({ p, style: { ...style, logo: "" }, shopLogo, created })); } catch { /* storage full or off */ } }, [p, style, shopLogo, created, ready]);
  useEffect(() => { if (p.image) thumb(p.image).then(setThumbP).catch(() => setThumbP("")); else setThumbP(""); }, [p.image]);
  useEffect(() => { if (created?.mode !== "packed") return; let live = true; packProduct(p).then((s) => live && setPacked(s)); return () => { live = false; }; }, [created?.mode, p]);

  const text = created ? (created.mode === "packed" ? `${origin}/p/q#${packed}` : `${origin}/p/${created.id}`) : `${origin}/p/${SAMPLE_ID}`;
  const pageUrl = created ? (created.mode === "packed" ? text : `${origin}/p/${created.id}`) : "";
  const ecc = created?.mode === "packed" ? "M" : "H";
  const logos: LogoOption[] = useMemo(() => [...(thumbP ? [{ key: "photo", label: "Product photo", src: thumbP }] : []), ...(shopLogo ? [{ key: "shop", label: "Shop logo", src: shopLogo }] : [])], [thumbP, shopLogo]);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((o) => ({ ...o, [k]: v }));
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 3000); };

  const api = useCallback(async (method: string, body: unknown) => {
    const r = await fetch("/api/product", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), j = await r.json().catch(() => ({}));
    return { status: r.status, ok: r.ok, j };
  }, []);

  const pickPhoto = async (f?: File) => { if (!f) return; setError(""); try { set("image", await compress(f)); } catch { setError("Could not use that photo. Try another one."); } };
  const pickLogo = async (f?: File) => { if (!f) return; try { setShopLogo(await thumb(await blobUrl(f), 200)); } catch { setError("Could not use that logo."); } };

  const create = async () => {
    setError("");
    const c = cleanProduct(p); if (!c.ok) { setError(c.error); return; }
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
  const png = async () => download(await svgToPng(qr, 1400), `${(p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-qr.png`, "image/png");
  const svgDl = () => download(new Blob([qr.svg], { type: "image/svg+xml" }), `${(p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-qr.svg`);
  const poster = async () => { try { download(await makePoster(p, await svgToPng(qr, 900)), "product-poster.png", "image/png"); } catch { setError("Could not make the poster."); } };
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

      <section className={card}>
        <h2 className="text-lg font-bold">3. Style your QR code</h2>
        <QrStyler text={text} style={style} onChange={setStyle} logos={logos} ecc={ecc} />
      </section>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="pq-error">{error}</p>}
      {note && <p className="text-sm text-green-700" aria-live="polite" data-testid="pq-note">{note}</p>}

      {!created ? (
        <button className="btn w-full" disabled={busy || !p.name.trim()} onClick={create} data-testid="pq-create">{busy ? "Creating…" : "Create my QR code"}</button>
      ) : (
        <section className={`${card} border-neutral-900`} data-testid="pq-done">
          <h2 className="text-lg font-bold">4. Your QR code is ready</h2>
          {created.mode === "packed" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This QR code holds the details itself, so it has no photo and is denser. When the site owner switches on storage, create it again to include the photo.</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={png} data-testid="pq-dl-png">Download PNG</button>
            <button className="btn-ghost" onClick={svgDl} data-testid="pq-dl-svg">Download SVG (for print shops)</button>
            <button className="btn-ghost" onClick={poster} data-testid="pq-dl-poster">Download poster</button>
          </div>
          <div className="space-y-2 text-sm"><p className="font-medium">Your product page</p>
            <div className="flex gap-2"><input readOnly aria-label="Product page link" data-testid="pq-link" className="input text-xs" value={created.mode === "packed" ? `${origin}/p/q#…` : pageUrl} /><button className="btn-ghost" onClick={() => copy(pageUrl, "Link copied.")}>Copy</button><a className="btn-ghost" href={pageUrl} target="_blank" rel="noreferrer" data-testid="pq-open">Open</a></div></div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            {created.mode === "hosted" && <button className="btn" disabled={busy} onClick={update} data-testid="pq-update">Save changes to this page</button>}
            <button className="btn-ghost" disabled={busy} onClick={reset}>New product</button>
            <button className="btn-ghost text-red-700" disabled={busy} onClick={remove}>Delete this page</button>
          </div>
          <p className="text-xs text-neutral-500">Change the price or photo any time with <b>Save changes</b>: the printed QR code stays the same. The page stays online for a year and renews each time you save.</p>
        </section>
      )}
      <p className="text-xs text-neutral-500">Your product details and photo are stored on our server so customers can open the page. We never see payments: the UPI button opens the customer&apos;s own app. Only the browser that created a page can change or delete it.</p>
    </div>
  );
}
