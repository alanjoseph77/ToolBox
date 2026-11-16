"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AudioLines, CalendarDays, Contact, FileText, Globe, Images, LayoutTemplate, ListChecks, MessageSquareHeart, ShoppingBag, Smartphone, Store, ThumbsUp, Ticket, UtensilsCrossed, Video, type LucideIcon } from "lucide-react";
import QrForm, { blank } from "@/components/QrForm";
import QrStyler from "@/components/QrStyler";
import EditLinkBox from "@/components/EditLinkBox";
import { download } from "@/lib/files";
import { THEMES } from "@/lib/productThemes";
import { MAX_IMAGES, QR_TYPES, cleanData, isHosted, listImages, typeOf, type Data, type QrType } from "@/lib/qrTypes";
import { DEFAULT_STYLE, qrSvg, svgToPng, type QrStyle } from "@/lib/qrStyle";

const ICONS: Record<string, LucideIcon> = { Globe, FileText, Images, Contact, Video, ListChecks, ThumbsUp, AudioLines, Store, Ticket, Smartphone, LayoutTemplate, CalendarDays, UtensilsCrossed, MessageSquareHeart };
interface Created { id: string; token: string; saved?: boolean }
interface Answers { count: number; average: number; entries: { r: number; c: string; n: string; t: number }[] }
const LS = "toolbox-qr-studio-v1";
const SAMPLE = "abcdefgh";

const fresh = (t: QrType): Data => ({ ...blank(t.fields), ...(t.defaults ?? {}), theme: "clean" } as Data);

export default function QrStudio() {
  const [typeId, setTypeId] = useState<string | null>(null);
  const [data, setData] = useState<Data>({});
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [created, setCreated] = useState<Created | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [origin, setOrigin] = useState("https://toolbox.otaga.in");
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const type = typeOf(typeId);
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 3500); };

  const choose = useCallback((t: QrType) => { setTypeId(t.id); setData(fresh(t)); setCreated(null); setError(""); setAnswers(null); }, []);

  // ---- start up: a link (?type=…, or an edit link ?edit=…&key=…) or the last draft ----
  useEffect(() => {
    setOrigin(location.origin);
    const q = new URLSearchParams(location.search), edit = q.get("edit"), key = q.get("key"), pre = typeOf(q.get("type"));
    (async () => {
      if (edit && key) {
        const r = await fetch(`/api/qr?id=${encodeURIComponent(edit)}&key=${encodeURIComponent(key)}`, { cache: "no-store" }).catch(() => null), j = await r?.json().catch(() => ({}));
        if (r?.ok && typeOf(j.type)) { setTypeId(j.type); setData(j.data); setCreated({ id: edit, token: key, saved: true }); } else setError(j?.error || "That edit link did not work. It may have expired or been deleted.");
      } else if (pre && !(() => { try { return JSON.parse(localStorage.getItem(LS) || "null")?.typeId === pre.id; } catch { return false; } })()) choose(pre);
      else { try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s?.typeId && typeOf(s.typeId)) { setTypeId(s.typeId); setData(s.data ?? {}); if (s.style) setStyle({ ...DEFAULT_STYLE, ...s.style, logo: "" }); if (s.created) setCreated(s.created); } } catch { /* nothing saved */ } }
      setReady(true);
    })();
  }, [choose]);
  useEffect(() => { if (!ready || !typeId) return; try { localStorage.setItem(LS, JSON.stringify({ typeId, data, style: { ...style, logo: "" }, created })); } catch { /* storage full or off */ } }, [ready, typeId, data, style, created]);

  const hosted = type ? isHosted(type, data) : false;
  const imgCount = type ? listImages(type, data).length : 0;
  const cleaned = useMemo(() => (type ? cleanData(type, data) : null), [type, data]);
  const link = created ? `${origin}/q/${created.id}` : "";
  const text = !type ? "" : hosted ? (link || `${origin}/q/${SAMPLE}`) : (cleaned?.ok ? (type.staticText?.(cleaned.d) ?? "") : "") || `${origin}/`;
  const ecc = hosted ? "H" : "M";
  const staticReady = !hosted && cleaned?.ok;

  const api = async (method: string, body: unknown) => { const r = await fetch("/api/qr", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }; };
  const create = async () => {
    if (!type) return; setError("");
    const c = cleanData(type, data); if (!c.ok) { setError(c.error); return; }
    setBusy(true);
    try { const r = await api("POST", { type: type.id, data: c.d }); if (r.ok) { setCreated({ id: r.j.id, token: r.j.token }); flash("Your QR page is live."); } else setError(r.status === 503 ? "QR pages need the site's storage, which is not switched on yet. The site owner can turn it on (see the setup notes)." : r.j.error || "Could not create the page."); }
    catch { setError("Could not reach the server. Check your internet and try again."); }
    setBusy(false);
  };
  const update = async () => {
    if (!type || !created) return; setError(""); const c = cleanData(type, data); if (!c.ok) { setError(c.error); return; }
    setBusy(true); const r = await api("PUT", { id: created.id, token: created.token, data: c.d }).catch(() => null); setBusy(false);
    if (r?.ok) flash("Saved. The same QR code now shows the new content."); else setError(r?.j?.error || "Could not save the changes.");
  };
  const remove = async () => { if (!created) return; setBusy(true); await api("DELETE", { id: created.id, token: created.token }).catch(() => null); setBusy(false); setCreated(null); setAnswers(null); flash("Deleted. The old QR code no longer works."); };
  const loadAnswers = useCallback(async () => {
    if (!created) return; const r = await fetch(`/api/qr/feedback?id=${created.id}&key=${created.token}`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) setAnswers(await r.json()); }, [created]);
  useEffect(() => { if (typeId === "feedback" && created) loadAnswers(); }, [typeId, created, loadAnswers]);

  const qr = useMemo(() => qrSvg(text, style, ecc), [text, style, ecc]);
  const nameBase = (type?.id ?? "qr") + "-qr";
  const png = async () => download(await svgToPng(qr, 1400), `${nameBase}.png`, "image/png", false);
  const svg = () => download(new Blob([qr.svg], { type: "image/svg+xml" }), `${nameBase}.svg`, "image/svg+xml", false);
  const copy = (t: string, m: string) => navigator.clipboard?.writeText(t).then(() => flash(m)).catch(() => flash("Could not copy."));
  const leave = () => !created || created.saved || window.confirm("You have not saved your private edit link yet. Without it you cannot edit or delete this page later. Leave anyway?");
  const editLink = created ? `${origin}/qr-studio?edit=${created.id}&key=${created.token}` : "";
  const card = "space-y-4 rounded-2xl border bg-white p-4 sm:p-5";

  // ================= chooser =================
  if (!type) {
    return (
      <div className="space-y-4" data-testid="qs-chooser">
        <p className="text-neutral-600">What should your QR code do? Pick a type.</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {QR_TYPES.slice(0, 12).map((t) => { const Icon = ICONS[t.icon] ?? Globe; return (
            <li key={t.id}><button type="button" onClick={() => choose(t)} data-testid={`qs-type-${t.id}`} className="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition hover:border-neutral-900 hover:bg-neutral-50">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100"><Icon className="h-6 w-6" aria-hidden /></span><span><b className="block">{t.name}</b><span className="text-sm text-neutral-500">{t.blurb}</span></span></button></li>); })}
          <li><Link href="/product-qr" data-testid="qs-type-product" className="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition hover:border-neutral-900 hover:bg-neutral-50"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100"><ShoppingBag className="h-6 w-6" aria-hidden /></span><span><b className="block">Product</b><span className="text-sm text-neutral-500">Photo, price and order buttons, with templates</span></span></Link></li>
          {QR_TYPES.slice(12).map((t) => { const Icon = ICONS[t.icon] ?? Globe; return (
            <li key={t.id}><button type="button" onClick={() => choose(t)} data-testid={`qs-type-${t.id}`} className="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition hover:border-neutral-900 hover:bg-neutral-50">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100"><Icon className="h-6 w-6" aria-hidden /></span><span><b className="block">{t.name}</b><span className="text-sm text-neutral-500">{t.blurb}</span></span></button></li>); })}
        </ul>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="qs-error">{error}</p>}
        <p className="text-xs text-neutral-500">Website and the inside-the-QR vCard need no page. Every other type makes a small mobile page that we host for you. You can edit it later and the printed QR code stays the same.</p>
      </div>
    );
  }

  const Icon = ICONS[type.icon] ?? Globe;
  return (
    <div className="space-y-5" data-testid="qs-editor" data-type={type.id}>
      <div className="flex flex-wrap items-center justify-between gap-2"><button className="btn-ghost !py-1.5" onClick={() => { if (leave()) { setTypeId(null); setCreated(null); } }} data-testid="qs-back">← All types</button>
        <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-5 w-5" aria-hidden />{type.name}</span></div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="qs-error">{error}</p>}
      {note && <p className="text-sm text-green-700" aria-live="polite" data-testid="qs-note">{note}</p>}

      <section className={card}>
        <h2 className="text-lg font-bold">1. Add your content</h2>
        <QrForm fields={type.fields} data={data} onChange={setData} onError={setError} />
        {hosted && type.fields.some((f) => f.kind === "image" || f.kind === "images" || f.kind === "list") && imgCount > 0 && <p className="text-sm text-neutral-600" data-testid="qs-imgcount">Pictures on this page: <b>{imgCount}</b> of {MAX_IMAGES}. {imgCount > MAX_IMAGES * 0.85 ? "You are close to the limit." : "Each is shrunk automatically so the page loads fast."}</p>}
        {hosted && (
          <div><p className="mb-2 text-sm font-medium">Colours of your page</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Page colours">{THEMES.map((t) => (
              <button key={t.id} role="radio" aria-checked={data.theme === t.id} data-testid={`qs-theme-${t.id}`} onClick={() => setData({ ...data, theme: t.id })} className={`flex min-h-[44px] items-center gap-2 rounded-full border px-3 py-2 text-sm ${data.theme === t.id ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-300"}`}>
                <span className="flex h-5 w-5 overflow-hidden rounded-full border"><span className="h-full w-1/2" style={{ background: t.card }} /><span className="h-full w-1/2" style={{ background: t.accent }} /></span>{t.name}</button>))}</div></div>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">2. Style your QR code</h2>
        <QrStyler text={text} style={style} onChange={setStyle} ecc={ecc} />
      </section>

      {hosted ? (
        !created ? <div className="sticky bottom-3 z-30 rounded-2xl bg-white/70 p-1 shadow-lg backdrop-blur"><button className="btn w-full" disabled={busy} onClick={create} data-testid="qs-create">{busy ? "Creating…" : "Create my QR code"}</button></div> : (
          <section className={`${card} border-neutral-900`} data-testid="qs-done">
            <h2 className="text-lg font-bold">3. Your QR code is ready</h2>
            <div className="flex flex-wrap gap-2"><button className="btn" onClick={png} data-testid="qs-dl-png">Download PNG</button><button className="btn-ghost" onClick={svg} data-testid="qs-dl-svg">Download SVG (for print shops)</button></div>
            <div className="space-y-2 text-sm"><p className="font-medium">Your page</p><div className="flex gap-2"><input readOnly aria-label="Page link" data-testid="qs-link" className="input text-xs" value={link} /><button className="btn-ghost" onClick={() => copy(link, "Link copied.")}>Copy</button><a className="btn-ghost" href={link} target="_blank" rel="noreferrer" data-testid="qs-open">Open</a></div></div>
            <EditLinkBox prefix="qs" editUrl={editLink} pageUrl={link} title={String(data.title ?? data.name ?? data.headline ?? type.name)} saved={!!created.saved} onSaved={() => setCreated((c) => (c ? { ...c, saved: true } : c))} />
            <div className="flex flex-wrap gap-2 border-t pt-3"><button className="btn" disabled={busy} onClick={update} data-testid="qs-update">Save changes to this page</button><button className="btn-ghost" disabled={busy} onClick={() => { if (leave()) { setTypeId(null); setCreated(null); } }}>Make another QR</button><button className="btn-ghost text-red-700" disabled={busy} onClick={remove}>Delete this page</button></div>
            <p className="text-xs text-neutral-500">The page stays online for a year and renews each time you save. After that, or after you delete it, the QR code stops working.</p>
            {type.id === "feedback" && (
              <div className="space-y-2 border-t pt-3" data-testid="qs-answers"><div className="flex items-center justify-between"><p className="font-semibold">Answers so far</p><button className="btn-ghost !py-1.5 text-sm" onClick={loadAnswers}>Refresh</button></div>
                {answers ? <><p className="text-sm" data-testid="qs-answers-summary">{answers.count} answer{answers.count === 1 ? "" : "s"}{answers.count ? ` · average ${answers.average} of 5 stars` : ""}</p>
                  <ul className="divide-y rounded-xl border bg-white text-sm">{answers.entries.slice(0, 50).map((e, i) => <li key={i} className="px-3 py-2"><p className="font-semibold">{"★".repeat(e.r)}{"☆".repeat(5 - e.r)} <span className="font-normal text-neutral-500">{e.n || "Anonymous"} · {new Date(e.t).toLocaleDateString()}</span></p>{e.c && <p className="whitespace-pre-wrap">{e.c}</p>}</li>)}</ul></> : <p className="text-sm text-neutral-500">Loading…</p>}</div>
            )}
          </section>
        )
      ) : (
        <section className={card} data-testid="qs-static">
          <h2 className="text-lg font-bold">3. Download</h2>
          {!staticReady && <p className="text-sm text-amber-700">{cleaned && !cleaned.ok ? cleaned.error : "Fill in the details above."}</p>}
          <div className="flex flex-wrap gap-2"><button className="btn" disabled={!staticReady} onClick={png} data-testid="qs-dl-png">Download PNG</button><button className="btn-ghost" disabled={!staticReady} onClick={svg} data-testid="qs-dl-svg">Download SVG (for print shops)</button></div>
          <p className="text-xs text-neutral-500">This QR code holds the content itself, so nothing is stored on our server and it never expires. To change it, you make a new QR code.</p>
        </section>
      )}
    </div>
  );
}
