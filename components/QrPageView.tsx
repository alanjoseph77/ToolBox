"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BadgeCheck, Calendar, Check, Copy, Download, ExternalLink, Flag, Globe, Mail, MapPin, MessageCircle, Phone, Play, Star } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";
import { themeOf, type Theme } from "@/lib/productThemes";
import { waDigits } from "@/lib/product";
import { embedUrl, ics, socialLink, SOCIAL_KEYS, vcard, type Data } from "@/lib/qrTypes";

type D = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown): D[] => (Array.isArray(v) ? (v as D[]) : []);
const ext = (h: string) => (h.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {});
const wa = (n: string, msg: string) => `https://wa.me/${waDigits(n)}?text=${encodeURIComponent(msg)}`;
const maps = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
const when = (v: string) => { const d = new Date(v); return isNaN(+d) ? v : d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }); };
function save(name: string, text: string, type: string) { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }

function Btn({ T, href, label, primary, icon, onClick, testid }: { T: Theme; href?: string; label: string; primary?: boolean; icon?: ReactNode; onClick?: () => void; testid?: string }) {
  const st: CSSProperties = primary ? { background: T.accent, color: T.accentInk, borderColor: T.accent } : { background: "transparent", color: T.ink, borderColor: `${T.muted}66` };
  const inner = <>{icon}{label}</>;
  return href ? <a href={href} {...ext(href)} className="btn w-full border" style={st} data-testid={testid}>{inner}</a> : <button type="button" onClick={onClick} className="btn w-full border" style={st} data-testid={testid}>{inner}</button>;
}
const I = (C: typeof Phone) => <C className="h-4 w-4" aria-hidden />;

export default function QrPageView({ id }: { id: string }) {
  const [rec, setRec] = useState<{ type: string; data: D } | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(location.href);
    fetch(`/api/qr?id=${encodeURIComponent(id)}`, { cache: "no-store" }).then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Could not load this page."); setRec(j); }).catch((e) => setError(e instanceof Error ? e.message : "Could not load this page."));
  }, [id]);
  const T = themeOf(rec?.data?.theme);
  useEffect(() => { const prev = document.body.style.background; document.body.style.background = T.bg; return () => { document.body.style.background = prev; }; }, [T.bg]);

  if (error) return <div className="rounded-2xl border bg-white p-6 text-center" role="alert" data-testid="qv-error"><p className="font-semibold">Page not available</p><p className="mt-1 text-sm text-neutral-600">{error}</p></div>;
  if (!rec) return <p className="py-20 text-center text-sm text-neutral-500">Loading…</p>;
  const d = rec.data, t = rec.type;
  return (
    <article className="overflow-hidden rounded-3xl border shadow-sm" data-testid="qv" data-type={t} data-theme={T.id} style={{ background: T.card, color: T.ink, borderColor: `${T.muted}33` }}>
      <Body type={t} d={d} T={T} id={id} url={url} />
      <div className="px-5 py-3 text-xs leading-relaxed opacity-70" style={{ background: `${T.muted}14`, borderTop: `1px solid ${T.muted}22` }}>
        <p className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Made by the page owner with ToolBox. ToolBox does not check owners, sell anything or take payments. Be careful with links and payments.</p>
        <a className="mt-1 inline-flex items-center gap-1 underline" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Report QR page " + id)}&body=${encodeURIComponent(url)}`}><Flag className="h-3 w-3" aria-hidden />Report this page</a>
      </div>
    </article>
  );
}

const Pad = ({ children }: { children: ReactNode }) => <div className="space-y-4 p-5">{children}</div>;
const H1 = ({ children }: { children: ReactNode }) => <h1 className="text-2xl font-extrabold leading-tight tracking-tight" data-testid="qv-title">{children}</h1>;
const Muted = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-relaxed opacity-75">{children}</p>;
const Img = ({ src, alt, cls = "" }: { src: string; alt: string; cls?: string }) => (src ? <img src={src} alt={alt} className={cls} /> : null);

function Body({ type, d, T, id, url }: { type: string; d: D; T: Theme; id: string; url: string }) {
  switch (type) {
    case "pdf": return <Pad><H1>{s(d.title)}</H1>{d.description && <Muted>{s(d.description)}</Muted>}<Btn T={T} primary href={s(d.pdfUrl)} label="Open the PDF" icon={I(Download)} testid="qv-main" /></Pad>;
    case "images": return <Gallery d={d} T={T} />;
    case "vcard": return <VCard d={d} T={T} />;
    case "video": return <Video d={d} T={T} />;
    case "links": return <Pad><div className="flex flex-col items-center gap-2 text-center"><Img src={s(d.avatar)} alt="" cls="h-24 w-24 rounded-full border object-cover" /><H1>{s(d.title)}</H1>{d.bio && <Muted>{s(d.bio)}</Muted>}</div><div className="grid gap-2" data-testid="qv-links">{arr(d.links).map((l, i) => <Btn key={i} T={T} primary={i === 0} href={s(l.url)} label={s(l.label)} icon={I(ExternalLink)} />)}</div></Pad>;
    case "social": return <Pad><div className="text-center"><H1>{s(d.title)}</H1>{d.bio && <Muted>{s(d.bio)}</Muted>}</div><div className="grid gap-2" data-testid="qv-links">{[...SOCIAL_KEYS, "linkedin"].map((k) => socialLink(k, d[k])).filter(Boolean).map((l, i) => <Btn key={l!.label} T={T} primary={i === 0} href={l!.href} label={l!.label} icon={I(ExternalLink)} />)}
      {d.whatsapp && <Btn T={T} href={wa(s(d.whatsapp), "Hi")} label="WhatsApp" icon={I(MessageCircle)} />}{d.website && <Btn T={T} href={s(d.website)} label="Website" icon={I(Globe)} />}{d.email && <Btn T={T} href={`mailto:${s(d.email)}`} label="Email" icon={I(Mail)} />}</div></Pad>;
    case "mp3": return <Pad><Img src={s(d.cover)} alt="" cls="mx-auto aspect-square w-48 rounded-2xl border object-cover" /><div className="text-center"><H1>{s(d.title)}</H1>{d.artist && <Muted>{s(d.artist)}</Muted>}</div><audio controls preload="none" src={s(d.audioUrl)} className="w-full" data-testid="qv-audio" /><Btn T={T} href={s(d.audioUrl)} label="Open the audio file" icon={I(Play)} /></Pad>;
    case "business": return <Business d={d} T={T} />;
    case "coupon": return <Coupon d={d} T={T} />;
    case "apps": return <Apps d={d} T={T} />;
    case "landing": return <Landing d={d} T={T} />;
    case "event": return <Event d={d} T={T} url={url} />;
    case "menu": return <Menu d={d} T={T} />;
    case "feedback": return <Feedback d={d} T={T} id={id} />;
    default: return <Pad><Muted>This page type is not supported.</Muted></Pad>;
  }
}

function Gallery({ d, T }: { d: D; T: Theme }) {
  const imgs = arr(d.images) as unknown as string[]; const [open, setOpen] = useState(-1);
  useEffect(() => { if (open < 0) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(-1); if (e.key === "ArrowRight") setOpen((o) => (o + 1) % imgs.length); if (e.key === "ArrowLeft") setOpen((o) => (o - 1 + imgs.length) % imgs.length); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, imgs.length]);
  return (
    <Pad><H1>{s(d.title)}</H1>{d.description && <Muted>{s(d.description)}</Muted>}
      <div className="grid grid-cols-2 gap-2" data-testid="qv-gallery">{imgs.map((src, i) => <button key={i} onClick={() => setOpen(i)} className="overflow-hidden rounded-xl border" aria-label={`Open picture ${i + 1}`}><img src={src} alt={`Picture ${i + 1}`} className="aspect-square w-full object-cover" /></button>)}</div>
      {open >= 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(-1)} data-testid="qv-lightbox">
          <img src={imgs[open]} alt={`Picture ${open + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
          {imgs.length > 1 && <><button className="absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + imgs.length) % imgs.length); }}>‹</button><button className="absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % imgs.length); }}>›</button></>}
          <button className="absolute right-3 top-3 h-11 w-11 rounded-full bg-white/20 text-xl text-white" aria-label="Close">✕</button>
        </div>
      )}
      <span className="hidden">{T.id}</span>
    </Pad>
  );
}

function VCard({ d, T }: { d: D; T: Theme }) {
  return (
    <Pad>
      <div className="flex flex-col items-center gap-2 text-center"><Img src={s(d.photo)} alt="" cls="h-28 w-28 rounded-full border object-cover" /><H1>{s(d.name)}</H1>{(d.title || d.company) && <Muted>{[s(d.title), s(d.company)].filter(Boolean).join(" · ")}</Muted>}</div>
      <div className="grid gap-2">
        <Btn T={T} primary label="Save contact" icon={I(Download)} testid="qv-savevcf" onClick={() => save(`${s(d.name).replace(/\s+/g, "-") || "contact"}.vcf`, vcard(d as Data), "text/vcard")} />
        {d.phone && <Btn T={T} href={`tel:${s(d.phone)}`} label={`Call ${s(d.phone)}`} icon={I(Phone)} />}{d.whatsapp && <Btn T={T} href={wa(s(d.whatsapp), "Hi")} label="WhatsApp" icon={I(MessageCircle)} />}
        {d.email && <Btn T={T} href={`mailto:${s(d.email)}`} label="Email" icon={I(Mail)} />}{d.website && <Btn T={T} href={s(d.website)} label="Website" icon={I(Globe)} />}
        {d.instagram && <Btn T={T} href={socialLink("instagram", d.instagram)!.href} label="Instagram" icon={I(ExternalLink)} />}{d.linkedin && <Btn T={T} href={s(d.linkedin)} label="LinkedIn" icon={I(ExternalLink)} />}
        {d.address && <Btn T={T} href={maps(s(d.address))} label="Directions" icon={I(MapPin)} />}
      </div>
      {d.address && <p className="flex gap-2 text-sm opacity-70"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{s(d.address)}</p>}
    </Pad>
  );
}

function Video({ d, T }: { d: D; T: Theme }) {
  const u = s(d.videoUrl), e = embedUrl(u), direct = /\.(mp4|webm|ogg)(\?.*)?$/i.test(u);
  return (
    <Pad><H1>{s(d.title)}</H1>
      {e ? <div className="aspect-video overflow-hidden rounded-xl border bg-black"><iframe src={e} title={s(d.title)} className="h-full w-full" allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" data-testid="qv-embed" /></div>
        : direct ? <video controls preload="metadata" src={u} className="w-full rounded-xl border bg-black" data-testid="qv-video" /> : null}
      {d.description && <Muted>{s(d.description)}</Muted>}<Btn T={T} primary={!e && !direct} href={u} label="Open the video" icon={I(Play)} /></Pad>
  );
}

function Business({ d, T }: { d: D; T: Theme }) {
  return (
    <Pad>
      <div className="flex items-center gap-4"><Img src={s(d.logo)} alt="" cls="h-20 w-20 shrink-0 rounded-2xl border object-cover" /><div><H1>{s(d.name)}</H1>{d.tagline && <p className="text-sm opacity-70">{s(d.tagline)}</p>}</div></div>
      {d.description && <Muted>{s(d.description)}</Muted>}
      {arr(d.services).length > 0 && <div className="flex flex-wrap gap-2" data-testid="qv-services">{arr(d.services).map((x, i) => <span key={i} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: `${T.muted}55` }}>{s(x.name)}</span>)}</div>}
      {d.hours && <div className="rounded-xl border p-3 text-sm" style={{ borderColor: `${T.muted}33` }}><p className="mb-1 font-semibold">Opening hours</p><p className="whitespace-pre-wrap opacity-80">{s(d.hours)}</p></div>}
      <div className="grid gap-2">
        {d.whatsapp && <Btn T={T} primary href={wa(s(d.whatsapp), `Hi ${s(d.name)}`)} label="Chat on WhatsApp" icon={I(MessageCircle)} />}{d.phone && <Btn T={T} primary={!d.whatsapp} href={`tel:${s(d.phone)}`} label="Call us" icon={I(Phone)} />}
        {d.website && <Btn T={T} href={s(d.website)} label="Visit website" icon={I(Globe)} />}{d.address && <Btn T={T} href={maps(s(d.address))} label="Get directions" icon={I(MapPin)} />}{d.email && <Btn T={T} href={`mailto:${s(d.email)}`} label="Email" icon={I(Mail)} />}
        {d.instagram && <Btn T={T} href={socialLink("instagram", d.instagram)!.href} label="Instagram" icon={I(ExternalLink)} />}{d.facebook && <Btn T={T} href={socialLink("facebook", d.facebook)!.href} label="Facebook" icon={I(ExternalLink)} />}
      </div>
      {d.address && <p className="flex gap-2 text-sm opacity-70"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{s(d.address)}</p>}
    </Pad>
  );
}

function Coupon({ d, T }: { d: D; T: Theme }) {
  const [copied, setCopied] = useState(false);
  const left = useMemo(() => { if (!d.validTill) return null; const end = new Date(`${d.validTill}T23:59:59`), days = Math.ceil((+end - Date.now()) / 86400000); return { expired: +end < Date.now(), days }; }, [d.validTill]);
  return (
    <>
      <Img src={s(d.image)} alt="" cls="aspect-[16/9] w-full object-cover" />
      <Pad>
        {d.shop && <p className="text-sm font-medium opacity-60">{s(d.shop)}</p>}
        <div className="rounded-2xl p-5 text-center" style={{ background: T.accent, color: T.accentInk }}>{d.badge && <p className="text-4xl font-black tracking-tight" data-testid="qv-badge">{s(d.badge)}</p>}<h1 className="mt-1 text-lg font-bold" data-testid="qv-title">{s(d.title)}</h1></div>
        {d.description && <Muted>{s(d.description)}</Muted>}
        {d.code && <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed p-3" style={{ borderColor: T.accent }}><span className="font-mono text-xl font-bold tracking-widest" data-testid="qv-code">{s(d.code)}</span>
          <button className="btn" style={{ background: T.accent, color: T.accentInk, borderColor: T.accent }} onClick={() => { navigator.clipboard?.writeText(s(d.code)).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <><Check className="h-4 w-4" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}</button></div>}
        {left && <p className={`text-sm font-semibold ${left.expired ? "text-red-600" : ""}`} data-testid="qv-valid">{left.expired ? "This coupon has expired." : left.days <= 1 ? "Valid until today" : `Valid for ${left.days} more days (till ${s(d.validTill)})`}</p>}
        {d.terms && <p className="text-xs opacity-60">{s(d.terms)}</p>}
        <div className="grid gap-2">{d.whatsapp && !left?.expired && <Btn T={T} primary href={wa(s(d.whatsapp), `Hi, I want to use coupon ${s(d.code)}: ${s(d.title)}`)} label="Redeem on WhatsApp" icon={I(MessageCircle)} />}{d.website && <Btn T={T} href={s(d.website)} label="Visit website" icon={I(Globe)} />}</div>
      </Pad>
    </>
  );
}

function Apps({ d, T }: { d: D; T: Theme }) {
  const [auto, setAuto] = useState("");
  useEffect(() => {
    const ua = navigator.userAgent, target = /iPhone|iPad|iPod/i.test(ua) ? s(d.iosUrl) : /Android/i.test(ua) ? s(d.androidUrl) : "";
    if (!target) return; setAuto(target); const tm = setTimeout(() => location.replace(target), 900); return () => clearTimeout(tm);
  }, [d.iosUrl, d.androidUrl]);
  return (
    <Pad>
      <div className="flex flex-col items-center gap-2 text-center"><Img src={s(d.icon)} alt="" cls="h-24 w-24 rounded-3xl border object-cover" /><H1>{s(d.name)}</H1>{d.tagline && <Muted>{s(d.tagline)}</Muted>}</div>
      {auto && <p className="text-center text-sm opacity-70" data-testid="qv-redirecting">Taking you to the app store…</p>}
      <div className="grid gap-2" data-testid="qv-stores">{d.iosUrl && <Btn T={T} primary href={s(d.iosUrl)} label="Download on the App Store" icon={I(Download)} />}{d.androidUrl && <Btn T={T} primary href={s(d.androidUrl)} label="Get it on Google Play" icon={I(Download)} />}{d.webUrl && <Btn T={T} href={s(d.webUrl)} label="Open the website" icon={I(Globe)} />}</div>
    </Pad>
  );
}

function Landing({ d, T }: { d: D; T: Theme }) {
  return (
    <>
      <Img src={s(d.image)} alt="" cls="aspect-[16/10] w-full object-cover" />
      <Pad><H1>{s(d.headline)}</H1>{d.subheadline && <p className="text-lg font-medium opacity-80">{s(d.subheadline)}</p>}{d.body && <p className="whitespace-pre-wrap text-[15px] leading-relaxed opacity-85">{s(d.body)}</p>}
        <div className="grid gap-2">{arr(d.buttons).map((b, i) => <Btn key={i} T={T} primary={i === 0} href={s(b.url)} label={s(b.label)} />)}</div>{d.footer && <p className="text-center text-xs opacity-60">{s(d.footer)}</p>}</Pad>
    </>
  );
}

function Event({ d, T, url }: { d: D; T: Theme; url: string }) {
  return (
    <>
      <Img src={s(d.image)} alt="" cls="aspect-[16/9] w-full object-cover" />
      <Pad><H1>{s(d.title)}</H1>
        <div className="rounded-xl border p-3 text-sm" style={{ borderColor: `${T.muted}33` }}><p className="flex gap-2 font-semibold" data-testid="qv-when"><Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{when(s(d.start))}</p>{d.end && <p className="mt-1 pl-6 opacity-70">until {when(s(d.end))}</p>}
          {(d.venue || d.address) && <p className="mt-2 flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{[s(d.venue), s(d.address)].filter(Boolean).join(", ")}</span></p>}</div>
        {d.description && <Muted>{s(d.description)}</Muted>}{d.organizer && <p className="text-sm opacity-70">Organised by {s(d.organizer)}</p>}
        <div className="grid gap-2">
          <Btn T={T} primary label="Add to calendar" icon={I(Calendar)} testid="qv-ics" onClick={() => save("event.ics", ics(d as Data, url), "text/calendar")} />
          {d.link && <Btn T={T} href={s(d.link)} label="Tickets / more info" icon={I(ExternalLink)} />}{(d.venue || d.address) && <Btn T={T} href={maps([s(d.venue), s(d.address)].filter(Boolean).join(", "))} label="Get directions" icon={I(MapPin)} />}{d.phone && <Btn T={T} href={`tel:${s(d.phone)}`} label="Call the organiser" icon={I(Phone)} />}
        </div>
      </Pad>
    </>
  );
}

function Menu({ d, T }: { d: D; T: Theme }) {
  const [q, setQ] = useState(""); const cur = s(d.currency) || "₹";
  const secs: D[] = arr(d.sections).map((sec) => ({ ...sec, items: arr(sec.items).filter((it) => !q || `${s(it.name)} ${s(it.desc)}`.toLowerCase().includes(q.toLowerCase())) })).filter((sec) => sec.items.length || (!q && !arr(sec.items).length));
  return (
    <>
      <Img src={s(d.cover)} alt="" cls="aspect-[16/8] w-full object-cover" />
      <Pad>
        <div><H1>{s(d.name)}</H1>{d.tagline && <p className="text-sm opacity-70">{s(d.tagline)}</p>}</div>
        <input aria-label="Search the menu" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-[15px]" style={{ borderColor: `${T.muted}55` }} data-testid="qv-search" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{arr(d.sections).map((sec, i) => <a key={i} href={`#sec-${i}`} className="shrink-0 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: `${T.muted}55` }}>{s(sec.name)}</a>)}</div>
        <div className="space-y-6" data-testid="qv-menu">
          {secs.map((sec, i) => (
            <section key={i} id={`sec-${i}`}><h2 className="mb-2 text-lg font-extrabold" style={{ color: T.accent === "#111111" ? T.ink : T.accent }}>{s(sec.name)}</h2>
              <ul className="divide-y" style={{ borderColor: `${T.muted}22` }}>{arr(sec.items).map((it, j) => (
                <li key={j} className="flex justify-between gap-3 py-2.5" data-testid="qv-dish"><div className="min-w-0"><p className="flex items-center gap-2 font-semibold">{it.veg && <span className={`inline-block h-3 w-3 rounded-sm border-2 ${it.veg === "veg" ? "border-green-600" : "border-red-600"}`} title={it.veg === "veg" ? "Veg" : "Non-veg"}><span className={`m-auto mt-[1px] block h-1 w-1 rounded-full ${it.veg === "veg" ? "bg-green-600" : "bg-red-600"}`} /></span>}{s(it.name)}</p>{it.desc && <p className="text-sm opacity-70">{s(it.desc)}</p>}</div>
                  {it.price && <p className="shrink-0 font-bold">{/^[\d.,\s]+$/.test(s(it.price)) ? `${cur}${s(it.price)}` : s(it.price)}</p>}</li>))}</ul></section>
          ))}
          {secs.length === 0 && <p className="text-sm opacity-70">No dishes match your search.</p>}
        </div>
        <div className="grid gap-2">{d.whatsapp && <Btn T={T} primary href={wa(s(d.whatsapp), `Hi ${s(d.name)}, I would like to order:`)} label="Order on WhatsApp" icon={I(MessageCircle)} />}{d.phone && <Btn T={T} primary={!d.whatsapp} href={`tel:${s(d.phone)}`} label="Call to order" icon={I(Phone)} />}{d.address && <Btn T={T} href={maps(s(d.address))} label="Get directions" icon={I(MapPin)} />}</div>
      </Pad>
    </>
  );
}

function Feedback({ d, T, id }: { d: D; T: Theme; id: string }) {
  const [rating, setRating] = useState(0), [comment, setComment] = useState(""), [name, setName] = useState(""), [state, setState] = useState<"form" | "busy" | "done">("form"), [err, setErr] = useState("");
  const submit = async () => {
    if (!rating) { setErr("Please choose 1 to 5 stars."); return; } setErr(""); setState("busy");
    const r = await fetch("/api/qr/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, rating, comment, name }) }).catch(() => null);
    if (r?.ok) setState("done"); else { setState("form"); setErr((await r?.json().catch(() => ({})))?.error || "Could not send. Please try again."); }
  };
  return (
    <Pad>
      {d.shop && <p className="text-sm font-medium opacity-60">{s(d.shop)}</p>}<H1>{s(d.title)}</H1>
      {state === "done" ? (
        <div className="space-y-3 text-center" data-testid="qv-thanks"><p className="text-4xl">🙏</p><p className="text-lg font-semibold">{s(d.thanks) || "Thank you! Your feedback helps us improve."}</p>
          {d.googleUrl && rating >= 4 && <Btn T={T} primary href={s(d.googleUrl)} label="Review us on Google" icon={I(Star)} testid="qv-google" />}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} data-testid={`qv-star-${n}`} className="p-1"><Star className="h-10 w-10" style={{ color: T.accent === "#111111" ? "#f59e0b" : T.accent }} fill={n <= rating ? "currentColor" : "none"} /></button>))}</div>
          <textarea aria-label="Your comment" className="w-full rounded-xl border bg-transparent p-3 text-[15px]" style={{ borderColor: `${T.muted}55` }} rows={4} maxLength={600} placeholder="Tell us more (optional)" value={comment} onChange={(e) => setComment(e.target.value)} data-testid="qv-comment" />
          <input aria-label="Your name" className="w-full rounded-xl border bg-transparent p-3 text-[15px]" style={{ borderColor: `${T.muted}55` }} maxLength={60} placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
          <Btn T={T} primary label={state === "busy" ? "Sending…" : "Send feedback"} onClick={submit} testid="qv-send" />
        </div>
      )}
    </Pad>
  );
}
