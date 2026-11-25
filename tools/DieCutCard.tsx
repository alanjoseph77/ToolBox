"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Printer, Scissors, Sparkles } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import PasteButton from "@/components/PasteButton";
import WaterLoader from "@/components/WaterLoader";
import { THEMES } from "@/lib/doorHanger";
import { CARD_DEFAULTS, DESIGNS, buildCard, contourOf, cutSvg, drawDesignThumb, hasTransparency, prepareFigure, renderFinal, sampleFigure, sheetFit, sheetPdf, type CardOpts, type Design } from "@/lib/dieCut";
import { qrText, type Fields, type Kind } from "@/lib/qrContent";
import { looksFlat, removeFlatBg } from "@/lib/flatbg";
import { removeBg } from "@/lib/bgremoval";
import { readsAs } from "@/lib/qrCheck";
import { canvasToBlob, download } from "@/lib/files";

type KindX = Kind | "instagram";
const KINDS_USED: { id: KindX; label: string }[] = [{ id: "link", label: "Website" }, { id: "whatsapp", label: "WhatsApp" }, { id: "instagram", label: "Instagram" }, { id: "phone", label: "Call" }, { id: "location", label: "Map" }];
type Method = "keep" | "graphic" | "photo";

/** Small live picture of one middle-panel design. */
function DesignThumb({ design, o }: { design: Design; o: CardOpts }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawDesignThumb(ref.current, design, o); });
  return <canvas ref={ref} width={320} height={190} className="block h-auto w-full rounded-lg" aria-hidden />;
}

/** Die-cut card maker: your picture becomes a cut-out sticker, fold-out QR card or hanger, with a cut line for a print-and-cut machine. */
export default function DieCutCard() {
  const [orig, setOrig] = useState<{ file: Blob; name: string } | null>(null);
  const [fig, setFig] = useState<HTMLCanvasElement | null>(null);
  const full = useRef<HTMLCanvasElement | null>(null);
  const setPicture = (src: CanvasImageSource, w: number, h: number) => { const f = prepareFigure(src, w, h, 2600); full.current = f; setFig(prepareFigure(f, f.width, f.height, 1000)); };
  const [method, setMethod] = useState<Method>("photo");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [o, setO] = useState<CardOpts>(CARD_DEFAULTS);
  const [kind, setKind] = useState<KindX>("link");
  const [f, setF] = useState<Fields>({ url: "https://" });
  const [size, setSize] = useState(130);
  const [sheet, setSheet] = useState<"A4" | "A3">("A4");
  const [showCut, setShowCut] = useState(true);
  const [showSafe, setShowSafe] = useState(true);
  const closedRef = useRef<HTMLCanvasElement>(null), photosIn = useRef<HTMLInputElement>(null);
  const [check, setCheck] = useState<"wait" | "good" | "near" | "bad" | "na">("na");
  const preview = useRef<HTMLCanvasElement>(null);
  const logoIn = useRef<HTMLInputElement>(null), shotIn = useRef<HTMLInputElement>(null);
  const takePic = async (file: File | undefined, key: "logo" | "shot") => { if (!file) return; try { const b = await createImageBitmap(file); set({ [key]: { src: b, w: b.width, h: b.height } } as Partial<CardOpts>); } catch { setMsg("Could not open that picture. Try a JPG or PNG."); } };
  const set = (p: Partial<CardOpts>) => setO((x) => ({ ...x, ...p }));
  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const value = useMemo(() => kind === "instagram" ? ((f.ig ?? "").replace(/^@/, "").trim() ? `https://www.instagram.com/${(f.ig ?? "").replace(/^@/, "").trim()}` : "") : qrText(kind, f), [kind, f]);
  const needsQr = o.mode !== "sticker" || o.badge;
  const qrIcon: CardOpts["qrIcon"] = o.mode === "book" ? (kind === "instagram" ? "insta" : o.logo ? "logo" : "none") : "none";
  const built = useMemo(() => (fig ? buildCard(fig, { ...o, qr: value, qrIcon }) : null), [fig, o, value, qrIcon]);
  const poly = useMemo(() => (built ? contourOf(built.art) : null), [built]);
  const dims = useMemo(() => { if (!built) return null; const a = built.art; if (o.mode === "book") { const ow = size * (1 + o.midW); return { w: ow, h: (ow * a.height) / a.width }; } return a.width >= a.height ? { w: size, h: (size * a.height) / a.width } : { w: (size * a.width) / a.height, h: size }; }, [built, size, o.mode]);
  const fit = dims ? sheetFit(dims.w, dims.h, sheet) : null;

  // load a picture: keep a transparent PNG as it is, otherwise take the background out
  const cutOut = async (file: Blob, m: Method) => {
    setBusy(true); setMsg("");
    try {
      let bmp: ImageBitmap;
      if (m === "keep") bmp = await createImageBitmap(file);
      else bmp = await createImageBitmap(m === "graphic" ? await removeFlatBg(file, 40, true) : await removeBg(file));
      setPicture(bmp, bmp.width, bmp.height);
    } catch { setMsg(m === "photo" ? "The AI background remover could not run here. Check your internet for the first download, or try Graphic mode for pictures on a plain colour." : "Could not cut the picture out. Try another picture."); }
    setBusy(false);
  };
  const take = async (file?: File) => {
    if (!file) return; setOrig({ file, name: file.name || "picture" }); setMsg("");
    try {
      const b = await createImageBitmap(file);
      const m: Method = hasTransparency(b, b.width, b.height) ? "keep" : (await looksFlat(file)) ? "graphic" : "photo";
      setMethod(m); await cutOut(file, m);
    } catch { setMsg("Could not open that picture. Try a JPG or PNG."); }
  };
  const sample = () => { const c = sampleFigure(); setOrig({ file: new Blob(), name: "Sample cup" }); setPicture(c, c.width, c.height); setMethod("keep"); setMsg(""); if (!value) { setKind("instagram"); setF((x) => ({ ...x, ig: "yourshop" })); set({ shop: "Your shop name" }); } };
  const redo = (m: Method) => { setMethod(m); if (orig && orig.file.size) cutOut(orig.file, m); };

  useEffect(() => {
    const c = preview.current; if (!c || !built || !poly) return;
    const a = built.art, k = Math.min(520 / a.width, 620 / a.height), W = Math.round(a.width * k), H = Math.round(a.height * k);
    c.width = W; c.height = H; const g = c.getContext("2d")!; g.clearRect(0, 0, W, H); g.drawImage(a, 0, 0, W, H);
    if (showCut) {
      g.save(); g.strokeStyle = "#e6007e"; g.lineWidth = 2.5; g.setLineDash([9, 6]); g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath(); g.stroke();
      if (built.hole) { g.beginPath(); g.arc(built.hole.x * k, built.hole.y * k, built.hole.r * k, 0, 7); g.stroke(); }
      if (built.crease) { g.strokeStyle = "#2563eb"; g.setLineDash([4, 7]); for (const cx of [built.crease.x, built.crease.x2]) { if (cx === undefined) continue; g.beginPath(); g.moveTo(cx * k, built.crease.y0 * k); g.lineTo(cx * k, built.crease.y1 * k); g.stroke(); } }
      if (showSafe && built.safe) { g.setLineDash([]); g.fillStyle = "rgba(34,197,94,.10)"; g.strokeStyle = "rgba(22,163,74,.55)"; g.lineWidth = 1.5; g.fillRect(built.safe.x * k, built.safe.y * k, built.safe.w * k, built.safe.h * k); g.strokeRect(built.safe.x * k, built.safe.y * k, built.safe.w * k, built.safe.h * k); }
      g.restore();
    }
    const cc = closedRef.current;
    if (cc && built.closed) { const f = built.closed, k2 = Math.min(260 / f.width, 300 / f.height); cc.width = Math.round(f.width * k2); cc.height = Math.round(f.height * k2); const cg = cc.getContext("2d")!; cg.drawImage(f, 0, 0, cc.width, cc.height); cg.strokeStyle = "rgba(0,0,0,.25)"; cg.lineWidth = 1.5; cg.beginPath(); cg.moveTo(cc.width / 2, 0); cg.lineTo(cc.width / 2, cc.height); cg.stroke(); }
  }, [built, poly, showCut, showSafe]);

  useEffect(() => {
    if (!built || !needsQr || !value) { setCheck(needsQr ? "wait" : "na"); return; }
    setCheck("wait"); let live = true;
    const t = setTimeout(async () => {
      const near = await readsAs(built.art, value, 900); let far = false;
      if (near) { const b = document.createElement("canvas"); b.width = b.height = 300; const g = b.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, 300, 300); g.filter = "blur(1px)"; const k = Math.min(280 / built.art.width, 280 / built.art.height); g.drawImage(built.art, 150 - (built.art.width * k) / 2, 150 - (built.art.height * k) / 2, built.art.width * k, built.art.height * k); far = await readsAs(b, value, 300); }
      if (live) setCheck(far ? "good" : near ? "near" : "bad");
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [built, value, needsQr]);

  const px300 = () => Math.round((dims!.w / 25.4) * 300);
  const finalOf = () => renderFinal(full.current ?? fig!, { ...o, qr: value, qrIcon }, px300());
  const artPng = async (f = finalOf()) => canvasToBlob(f.canvas, "image/png");
  const ready = !!built && !!poly && !!dims && (!needsQr || !!value);
  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(""); try { await fn(); } catch { setMsg("Could not make the file on this device. Try again or use a smaller size."); } setBusy(false); };
  const savePng = () => run(async () => download(await artPng(), `die-cut-${o.mode}.png`, "image/png", false));
  const saveSvg = () => run(async () => { const f = finalOf(); download(new Blob([cutSvg(f.poly, f.built.hole, f.built.art.width, f.built.art.height, dims!.w, dims!.h)], { type: "image/svg+xml" }), `die-cut-${o.mode}-cutline.svg`, "image/svg+xml", false); });
  const savePdf = (cut: "machine" | "scissors") => run(async () => {
    const f = finalOf(), bytes = new Uint8Array(await (await artPng(f)).arrayBuffer());
    const note = cut === "machine" ? `Print at 100%. The pink line is a spot colour called CutContour for the print-and-cut machine. ${dims!.w.toFixed(0)} x ${dims!.h.toFixed(0)} mm.` : `Print at 100%. Cut along the dashed line. ${dims!.w.toFixed(0)} x ${dims!.h.toFixed(0)} mm.`;
    download(await sheetPdf(f.built.art, f.poly, f.built.hole, dims!.w, dims!.h, sheet, cut, bytes, note), `die-cut-${o.mode}-${sheet}-${cut}.pdf`, "application/pdf", false);
  });

  const field = (k: string, label: string, ph: string, type = "text") => <div><label className="label" htmlFor={`dc-${k}`}>{label}</label><input id={`dc-${k}`} data-testid={`dc-${k}`} className="input" type={type} value={f[k] ?? ""} onChange={setField(k)} placeholder={ph} /></div>;
  const txt = (id: string, label: string, v: string, s: (x: string) => void, max: number, ph = "") => <div><label className="label" htmlFor={`dc-${id}`}>{label}</label><input id={`dc-${id}`} data-testid={`dc-${id}`} className="input" value={v} maxLength={max} onChange={(e) => s(e.target.value)} placeholder={ph} /></div>;
  const logoInput = useRef<HTMLInputElement>(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <div className="min-w-0 space-y-5">
        <section className="card space-y-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold">1. Your picture</h2>
          {!fig ? (
            <>
              <Dropzone accept="image/*" onFiles={(fs) => take(fs[0])} hint="A character, product or logo. A clear picture on a plain background cuts out best." />
              <button className="btn-ghost w-full" onClick={sample} data-testid="dc-sample"><Sparkles className="h-4 w-4" /> No picture? Try a sample</button>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="truncate font-medium" data-testid="dc-picname">{orig?.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn-ghost !py-1.5" onClick={() => logoInput.current?.click()}><ImagePlus className="h-4 w-4" /> Change picture</button>
                <PasteButton small label="Paste" onFiles={(fs) => take(fs[0])} />
                <button className="btn-ghost !py-1.5" onClick={() => { setFig(null); setOrig(null); }}>Remove</button>
                <input ref={logoInput} type="file" accept="image/*" hidden data-testid="dc-input" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              {orig && orig.file.size > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-neutral-500">Background:</span>
                {([["keep", "Already transparent"], ["graphic", "Plain colour"], ["photo", "Photo (AI)"]] as [Method, string][]).map(([k, l]) => <button key={k} className={`chip ${method === k ? "chip-active" : ""}`} onClick={() => redo(k)} data-testid={`dc-method-${k}`}>{l}</button>)}</div>}
            </div>
          )}
          {busy && <WaterLoader active={busy} label="Cutting out the picture…" hints={["First run downloads the AI model (~40 MB)", "Then it is much faster", "Almost there…"]} />}
          {msg && <p className="text-sm text-red-600" role="alert" data-testid="dc-msg">{msg}</p>}
        </section>

        <section className="card space-y-4 p-4 sm:p-5">
          <h2 className="text-lg font-bold">2. Choose a design</h2>
          <p className="-mt-2 text-sm text-neutral-500">The left and right flaps are your picture. The design is for the long middle panel inside.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Design">
            {DESIGNS.map((d) => <button key={d.id} role="radio" aria-checked={o.design === d.id} onClick={() => set({ design: d.id })} data-testid={`dc-design-${d.id}`} className={`rounded-xl border p-1.5 text-center text-xs font-semibold ${o.design === d.id ? "border-neutral-900 ring-2 ring-neutral-900 dark:border-white dark:ring-white" : "border-neutral-200 hover:border-neutral-900 dark:border-neutral-800"}`}>
              <DesignThumb design={d.id} o={{ ...o, qr: value, qrIcon }} /><span className="mt-1 block">{d.name}</span></button>)}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
            {THEMES.map((th) => <button key={th.id} role="radio" aria-checked={o.theme === th.id} aria-label={th.name} title={th.name} onClick={() => set({ theme: th.id })} data-testid={`dc-theme-${th.id}`} className={`h-11 w-11 rounded-full border-2 ${o.theme === th.id ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2 dark:border-white dark:ring-white" : "border-white shadow"}`} style={{ background: `linear-gradient(135deg, ${th.bg} 55%, ${th.accent} 55%)` }} />)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="flex justify-between gap-2"><span>Closed card width</span><span className="text-neutral-500">{size} mm</span></span><input type="range" min={60} max={sheet === "A3" ? 200 : 140} step={5} value={size} onChange={(e) => setSize(+e.target.value)} className="mt-1 h-8 w-full" data-testid="dc-size" aria-label="Closed card width" /></label>
            <label className="block text-sm"><span className="flex justify-between"><span>Middle panel length</span><span className="text-neutral-500">{Math.round(o.midW * 100)}%</span></span><input type="range" min={1} max={2} step={0.05} value={o.midW} onChange={(e) => set({ midW: +e.target.value })} className="mt-1 h-8 w-full" data-testid="dc-midw" aria-label="Middle panel length" /></label>
            <label className="block text-sm"><span className="flex justify-between"><span>White border</span><span className="text-neutral-500">{o.border}%</span></span><input type="range" min={0} max={8} step={0.5} value={o.border} onChange={(e) => set({ border: +e.target.value })} className="mt-1 h-8 w-full" data-testid="dc-border" aria-label="White border" /></label>
          </div>
          {o.midW > 1 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">With a longer middle panel the two halves of the picture do not meet when closed: a strip of the panel shows between them. At 100% they close into the full picture.</p>}
        </section>

        {needsQr && (
          <section className="card space-y-3 p-4 sm:p-5">
            <h2 className="text-lg font-bold">3. Words and QR code</h2>
            <div className="grid gap-3 sm:grid-cols-2">{txt("shop", "Shop or name", o.shop, (s) => set({ shop: s }), 40, "Your shop name")}{txt("cta", "Words on the QR tag", o.cta, (s) => set({ cta: s }), 14, "SCAN ME")}</div>
            {txt("sub", "Small line", o.sub, (s) => set({ sub: s }), 70, "Follow us and order online")}
            {(o.design === "offer" || o.design === "coupon") && txt("offer", "Big offer", o.offer, (s) => set({ offer: s }), 24, "20% OFF")}
            <div className="grid gap-3 sm:grid-cols-2">{txt("phone", "Phone number (optional)", o.phone, (s) => set({ phone: s }), 22, "+91 98765 43210")}{txt("handle", "Social name (optional)", o.handle, (s) => set({ handle: s }), 24, "yourshop")}</div>
            {(o.design === "contact" || o.design === "bold") && txt("address", "Address (optional)", o.address, (s) => set({ address: s }), 48, "12 Market Road, Kochi")}
            {(o.design === "classic" || o.design === "dark") && !o.shot && <div className="space-y-2"><div className="grid grid-cols-3 gap-2">{txt("posts", "Posts", o.posts, (s) => set({ posts: s }), 7, "120")}{txt("followers", "Followers", o.followers, (s) => set({ followers: s }), 7, "4,532")}{txt("following", "Following", o.following, (s) => set({ following: s }), 7, "12")}</div><p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">These are sample numbers for the phone page. Type your real ones, or add a screenshot of your own profile.</p></div>}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button className="btn-ghost !py-1.5" onClick={() => logoIn.current?.click()} data-testid="dc-logo-btn"><ImagePlus className="h-4 w-4" /> {o.logo ? "Change logo" : "Add your logo"}</button>
              {(o.design === "classic" || o.design === "dark") && <button className="btn-ghost !py-1.5" onClick={() => shotIn.current?.click()} data-testid="dc-shot-btn"><ImagePlus className="h-4 w-4" /> {o.shot ? "Change profile screenshot" : "Add a profile screenshot"}</button>}
              {(o.design === "classic" || o.design === "dark" || o.design === "gallery") && <button className="btn-ghost !py-1.5" onClick={() => photosIn.current?.click()} data-testid="dc-photos-btn"><ImagePlus className="h-4 w-4" /> {o.photos.length ? `Product photos (${o.photos.length}/6)` : "Add product photos (up to 6)"}</button>}
              {(o.logo || o.shot || o.photos.length > 0) && <button className="btn-ghost !py-1.5" onClick={() => set({ logo: null, shot: null, photos: [] })}>Remove these</button>}
              <input ref={photosIn} type="file" accept="image/*" multiple hidden data-testid="dc-photos-input" onChange={async (e) => { const fs = [...(e.target.files ?? [])].slice(0, 6); e.target.value = ""; try { const ps = await Promise.all(fs.map(async (f) => { const b = await createImageBitmap(f); return { src: b, w: b.width, h: b.height }; })); set({ photos: ps }); } catch { setMsg("Could not open one of the pictures."); } }} />
              <input ref={logoIn} type="file" accept="image/*" hidden data-testid="dc-logo-input" onChange={(e) => { takePic(e.target.files?.[0], "logo"); e.target.value = ""; }} />
              <input ref={shotIn} type="file" accept="image/*" hidden data-testid="dc-shot-input" onChange={(e) => { takePic(e.target.files?.[0], "shot"); e.target.value = ""; }} />
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="QR code type">{KINDS_USED.map((k) => <button key={k.id} role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} data-testid={`dc-kind-${k.id}`} className={`chip ${kind === k.id ? "chip-active" : ""}`}>{k.label}</button>)}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {kind === "link" && <div className="sm:col-span-2">{field("url", "Website address", "https://yourshop.in", "url")}</div>}
              {kind === "whatsapp" && <>{field("phone", "WhatsApp number", "+91 98765 43210", "tel")}{field("message", "Ready message (optional)", "Hi, I saw your card")}</>}
              {kind === "instagram" && <div className="sm:col-span-2">{field("ig", "Instagram name", "@yourshop")}</div>}
              {kind === "phone" && <div className="sm:col-span-2">{field("phone", "Phone number", "+91 98765 43210", "tel")}</div>}
              {kind === "location" && <div className="sm:col-span-2">{field("place", "Shop name and area", "Sweet Crumbs Bakery, Kochi")}</div>}
            </div>
            {!value && <p className="text-sm text-amber-700" data-testid="dc-needs">Add the QR details to turn on the downloads. The QR in the preview is only a sample.</p>}
          </section>
        )}
      </div>

      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <div className="card space-y-3 p-4">
          {built ? (
            <>
              <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-[repeating-conic-gradient(#e5e5e5_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-3">
                <canvas ref={preview} data-testid="dc-preview" aria-label="Die-cut preview" className="mx-auto block h-auto max-w-full drop-shadow-lg" />
              </div>
              <label className="flex min-h-[40px] items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={showCut} onChange={(e) => setShowCut(e.target.checked)} data-testid="dc-showcut" /> <Scissors className="h-4 w-4 text-pink-600" /> Show the cut line</label>
              {o.mode === "book" && dims && <div className="space-y-2" data-testid="dc-dims">
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600"><span className="flex items-center gap-1"><i className="inline-block h-0 w-5 border-t-2 border-dashed border-blue-600" /> Fold line</span><span className="flex items-center gap-1"><i className="inline-block h-0 w-5 border-t-2 border-dashed border-pink-600" /> Die-cut line</span><span className="flex items-center gap-1"><i className="inline-block h-3 w-5 rounded-sm border border-green-600/60 bg-green-500/10" /> Safe print area</span>
                  <label className="ml-auto flex items-center gap-1"><input type="checkbox" checked={showSafe} onChange={(e) => setShowSafe(e.target.checked)} data-testid="dc-showsafe" /> show</label></div>
                <div className="rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"><b>Closed:</b> {size} × {dims.h | 0} mm · <b>Open:</b> {dims.w | 0} × {dims.h | 0} mm<br /><b>Left flap</b> {size / 2 | 0} mm · <b>Middle panel</b> {(size * o.midW) | 0} mm · <b>Right flap</b> {size / 2 | 0} mm<br />Fold the two flaps over the middle panel. They meet in the middle and the card closes into the full picture.</div>
                <div className="text-center"><canvas ref={closedRef} data-testid="dc-closed" aria-label="Closed card" className="mx-auto block rounded-lg bg-[repeating-conic-gradient(#e5e5e5_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-2" /><p className="mt-1 text-xs font-medium text-neutral-600">Closed card (front view)</p></div></div>}
              {needsQr && <p className={`rounded-lg px-3 py-2 text-sm ${check === "good" ? "bg-green-50 text-green-800" : check === "near" ? "bg-amber-50 text-amber-900" : check === "bad" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-600"}`} data-testid="dc-check" data-state={check}>
                {!value ? "Add your QR details to check that it scans." : check === "good" ? "✓ Scan check passed, also from far away" : check === "near" ? "Scans up close only. Make it bigger or use a shorter link." : check === "bad" ? "This does not scan. Use a shorter link." : "Checking that it scans…"}</p>}
              <div className="space-y-2">
                <button className="btn w-full" disabled={!ready || busy || !fit?.per} onClick={() => savePdf("machine")} data-testid="dc-pdf-machine"><Printer className="h-4 w-4" /> Print sheet for a print-and-cut machine</button>
                <button className="btn-ghost w-full" disabled={!ready || busy || !fit?.per} onClick={() => savePdf("scissors")} data-testid="dc-pdf-scissors"><Scissors className="h-4 w-4" /> Print sheet with a dashed line (scissors)</button>
                <div className="grid grid-cols-2 gap-2"><button className="btn-ghost" disabled={!ready || busy} onClick={savePng} data-testid="dc-png"><Download className="h-4 w-4" /> PNG</button><button className="btn-ghost" disabled={!ready || busy} onClick={saveSvg} data-testid="dc-svg"><Download className="h-4 w-4" /> Cut line SVG</button></div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500"><span data-testid="dc-fit">{fit?.per ? `${fit.per} on one ${sheet} sheet` : `Too big for ${sheet}. Make it smaller.`}</span><span className="flex gap-1">{(["A4", "A3"] as const).map((s) => <button key={s} className={`chip !px-3 !py-1 ${sheet === s ? "chip-active" : ""}`} onClick={() => setSheet(s)} data-testid={`dc-sheet-${s}`}>{s}</button>)}</span></div>
              <p className="text-xs text-neutral-500">Machine file: the pink line is a spot colour named CutContour, which print-and-cut machines (Roland, Mimaki and similar) cut along. Print at 100%. Folding is by hand along the blue lines.</p>
            </>
          ) : <p className="text-sm text-neutral-500">Add a picture and your die-cut card appears here.</p>}
          {msg && built && <p className="text-sm text-red-600" role="alert">{msg}</p>}
        </div>
      </aside>
    </div>
  );
}
