"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, ImagePlus, Printer } from "lucide-react";
import PasteButton from "@/components/PasteButton";
import { DEFAULTS, DW, SAMPLE_LINK, SHAPES, THEMES, dh, drawHanger, hangerAdvice, sheetLayout, type HShape, type HangerData } from "@/lib/doorHanger";
import { qrText, type Fields, type Kind } from "@/lib/qrContent";
import { readsAs } from "@/lib/qrCheck";
import { canvasToBlob, download } from "@/lib/files";

type Logo = { src: CanvasImageSource; w: number; h: number; name: string };
const KINDS_USED: { id: Kind; label: string }[] = [{ id: "link", label: "Website" }, { id: "whatsapp", label: "WhatsApp" }, { id: "phone", label: "Call" }, { id: "location", label: "Map" }, { id: "text", label: "Text" }];

/** Door hanger maker: a printable card for a door handle, with your offer and a QR code. */
export default function DoorHanger() {
  const [shape, setShape] = useState<HShape>("classic");
  const [theme, setTheme] = useState("orange");
  const [shop, setShop] = useState(DEFAULTS.shop);
  const [headline, setHeadline] = useState(DEFAULTS.headline);
  const [sub, setSub] = useState(DEFAULTS.sub);
  const [cta, setCta] = useState(DEFAULTS.cta);
  const [foot, setFoot] = useState(DEFAULTS.foot);
  const [kind, setKind] = useState<Kind>("link");
  const [f, setF] = useState<Fields>({ url: "https://" });
  const [logo, setLogo] = useState<Logo | null>(null);
  const [check, setCheck] = useState<"wait" | "good" | "near" | "bad">("wait");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const value = useMemo(() => qrText(kind, f), [kind, f]);
  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const data = (qr: string): HangerData => ({ shape, theme, shop, headline, sub, cta, foot, logo: logo?.src ?? null, logoW: logo?.w, logoH: logo?.h, qr });
  const advice = hangerAdvice({ headline, sub, qr: value, shop });

  useEffect(() => {
    const c = preview.current; if (!c) return;
    drawHanger(c, data(value || SAMPLE_LINK), 640);
    if (!value) { setCheck("wait"); return; }
    setCheck("wait");
    let live = true;
    const t = setTimeout(async () => {
      const near = await readsAs(c, value, 640);
      let far = false;
      if (near) { const b = document.createElement("canvas"); b.width = b.height = 300; const g = b.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, 300, 300); g.filter = "blur(1px)"; const k = Math.min(280 / c.width, 280 / c.height); g.drawImage(c, 150 - (c.width * k) / 2, 150 - (c.height * k) / 2, c.width * k, c.height * k); far = await readsAs(b, value, 300); }
      if (live) setCheck(far ? "good" : near ? "near" : "bad");
    }, 350);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, theme, shop, headline, sub, cta, foot, logo, value]);

  const takeLogo = async (file?: File) => {
    if (!file) return; setMsg("");
    try { const b = await createImageBitmap(file); setLogo({ src: b, w: b.width, h: b.height, name: file.name }); }
    catch { setMsg("Could not open that picture. Try a JPG or PNG."); }
  };

  const mmPx = (mm: number) => Math.round((mm / 25.4) * 300);
  const savePng = async () => {
    if (!value) return; setBusy(true); setMsg("");
    try { const c = document.createElement("canvas"); drawHanger(c, data(value), mmPx(SHAPES[shape].mm[0])); download(await canvasToBlob(c, "image/png"), `door-hanger-${shape}.png`, "image/png", false); }
    catch { setMsg("Could not make the picture on this device. Try again."); }
    setBusy(false);
  };
  const savePdf = async () => {
    if (!value) return; setBusy(true); setMsg("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const L = sheetLayout(shape), MM = 72 / 25.4;
      const c = document.createElement("canvas"); drawHanger(c, data(value), mmPx(L.w), true);
      const pdf = await PDFDocument.create(), page = pdf.addPage([L.pw * MM, L.ph * MM]), img = await pdf.embedPng(new Uint8Array(await (await canvasToBlob(c, "image/png")).arrayBuffer()));
      const totalW = L.cols * L.w + (L.cols - 1) * L.G, totalH = L.rows * L.h + (L.rows - 1) * L.G, x0 = (L.pw - totalW) / 2, y0 = (L.ph - totalH) / 2;
      for (let r = 0; r < L.rows; r++) for (let q = 0; q < L.cols; q++) page.drawImage(img, { x: (x0 + q * (L.w + L.G)) * MM, y: (L.ph - y0 - (r + 1) * L.h - r * L.G) * MM, width: L.w * MM, height: L.h * MM });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(`Print at 100% (no "fit to page"). Cut on the dashed line, punch the hole${SHAPES[shape].hint.includes("slot") ? " and cut the slot" : ""}. ${L.w} x ${L.h} mm.`, { x: 12, y: 8, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
      download(await pdf.save(), `door-hanger-${shape}-sheet.pdf`, "application/pdf", false);
    } catch { setMsg("Could not make the PDF on this device. Try the PNG instead."); }
    setBusy(false);
  };

  const field = (k: string, label: string, ph: string, type = "text") => (
    <div><label className="label" htmlFor={`dh-${k}`}>{label}</label><input id={`dh-${k}`} data-testid={`dh-${k}`} className="input" type={type} value={f[k] ?? ""} onChange={setField(k)} placeholder={ph} /></div>
  );
  const txt = (id: string, label: string, v: string, set: (s: string) => void, max: number, ph = "") => (
    <div><label className="label" htmlFor={`dh-${id}`}>{label}</label><input id={`dh-${id}`} data-testid={`dh-${id}`} className="input" value={v} maxLength={max} onChange={(e) => set(e.target.value)} placeholder={ph} /></div>
  );
  const L = sheetLayout(shape);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="min-w-0 space-y-5">
        <section className="card space-y-4 p-4 sm:p-5">
          <h2 className="text-lg font-bold">1. Shape and colour</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Shape">
            {(Object.keys(SHAPES) as HShape[]).map((k) => (
              <button key={k} role="radio" aria-checked={shape === k} onClick={() => setShape(k)} data-testid={`dh-shape-${k}`} className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-sm font-semibold ${shape === k ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black" : "bg-white hover:border-neutral-900 dark:bg-black"}`}>
                {SHAPES[k].label}<span className={`text-[11px] font-normal ${shape === k ? "opacity-70" : "text-neutral-500"}`}>{SHAPES[k].mm[0]}×{SHAPES[k].mm[1]} mm</span>
              </button>))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
            {THEMES.map((t) => (
              <button key={t.id} role="radio" aria-checked={theme === t.id} aria-label={t.name} title={t.name} onClick={() => setTheme(t.id)} data-testid={`dh-theme-${t.id}`}
                className={`h-11 w-11 rounded-full border-2 ${theme === t.id ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2 dark:border-white dark:ring-white" : "border-white shadow"}`} style={{ background: `linear-gradient(135deg, ${t.bg} 55%, ${t.accent} 55%)` }} />))}
          </div>
        </section>

        <section className="card space-y-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold">2. Your words</h2>
          {txt("shop", "Shop name", shop, setShop, 40, "Your shop name")}
          {txt("headline", "Big offer", headline, setHeadline, 40, "20% OFF")}
          {txt("sub", "Small line", sub, setSub, 80, "On your first order this week")}
          <div className="grid gap-3 sm:grid-cols-2">{txt("cta", "Button words", cta, setCta, 30, "Scan to order")}{txt("foot", "Bottom line", foot, setFoot, 48, "Valid till 31 Dec")}</div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button className="btn-ghost !py-1.5" onClick={() => logoInput.current?.click()} data-testid="dh-logo-btn"><ImagePlus className="h-4 w-4" /> {logo ? "Change logo" : "Add your logo"}</button>
            <PasteButton small label="Paste" onFiles={(files) => takeLogo(files[0])} />
            {logo && <><span className="min-w-0 truncate text-neutral-500" data-testid="dh-logoname">{logo.name}</span><button className="btn-ghost !py-1.5" onClick={() => setLogo(null)}>Remove</button></>}
            <input ref={logoInput} type="file" accept="image/*" hidden data-testid="dh-logo-input" onChange={(e) => { takeLogo(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </section>

        <section className="card space-y-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold">3. What should the QR code do?</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="QR code type">
            {KINDS_USED.map((k) => <button key={k.id} role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} data-testid={`dh-kind-${k.id}`} className={`chip ${kind === k.id ? "chip-active" : ""}`}>{k.label}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {kind === "link" && <div className="sm:col-span-2">{field("url", "Website address", "https://yourshop.in", "url")}</div>}
            {kind === "whatsapp" && <>{field("phone", "WhatsApp number", "+91 98765 43210", "tel")}{field("message", "Ready message (optional)", "Hi, I saw your offer")}</>}
            {kind === "phone" && <div className="sm:col-span-2">{field("phone", "Phone number", "+91 98765 43210", "tel")}</div>}
            {kind === "location" && <div className="sm:col-span-2">{field("place", "Shop name and area", "Sweet Crumbs Bakery, Kochi")}</div>}
            {kind === "text" && <div className="sm:col-span-2">{field("text", "Text to show", "Show this at the counter for 20% off")}</div>}
          </div>
          {!value && <p className="text-sm text-amber-700" data-testid="dh-needs">Add the {kind === "link" ? "website address" : kind === "whatsapp" ? "WhatsApp number" : kind === "phone" ? "phone number" : kind === "location" ? "place" : "text"} to turn on the downloads. The QR in the preview is only a sample.</p>}
        </section>
      </div>

      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <div className="card space-y-3 p-4">
          <div className="mx-auto w-full max-w-[250px] rounded-2xl bg-[repeating-conic-gradient(#e5e5e5_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-3">
            <canvas ref={preview} data-testid="dh-preview" aria-label="Door hanger preview" className="mx-auto block w-full drop-shadow-lg" style={{ aspectRatio: `${DW} / ${dh(shape)}` }} />
          </div>
          <p className={`rounded-lg px-3 py-2 text-sm ${check === "good" ? "bg-green-50 text-green-800" : check === "near" ? "bg-amber-50 text-amber-900" : check === "bad" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-600"}`} data-testid="dh-check" data-state={check}>
            {!value ? "Add your QR details to check that it scans." : check === "good" ? "✓ Scan check passed, also from far away" : check === "near" ? "Scans up close only. Use a shorter link or a bigger card." : check === "bad" ? "This does not scan. Use a shorter link." : "Checking that it scans…"}
          </p>
          {advice.map((a) => <p key={a} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{a}</p>)}
          <div className="space-y-2">
            <button className="btn w-full" disabled={!value || busy} onClick={savePdf} data-testid="dh-pdf"><Printer className="h-4 w-4" /> Print sheet (PDF, {L.per} on A4)</button>
            <button className="btn-ghost w-full" disabled={!value || busy} onClick={savePng} data-testid="dh-png"><Download className="h-4 w-4" /> Picture for the print shop (PNG)</button>
          </div>
          {msg && <p className="text-sm text-red-600" role="alert">{msg}</p>}
          <p className="flex gap-2 text-xs text-neutral-500"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Print at 100%, cut on the dashed line, punch the hole{SHAPES[shape].hint.includes("slot") ? " and cut the slot up to the edge" : ""}. A print shop can die-cut a stack in minutes.</p>
        </div>
      </aside>
    </div>
  );
}
