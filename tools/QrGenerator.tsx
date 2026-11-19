"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import QrStyler from "@/components/QrStyler";
import { DEFAULT_STYLE, qrSvg, svgToPng, type QrStyle } from "@/lib/qrStyle";
import { KINDS, needs, qrText, type Fields, type Kind } from "@/lib/qrContent";
import { download } from "@/lib/files";

/** Any kind of QR code (link, text, Wi-Fi, WhatsApp…) in many designs, downloaded as PNG or SVG. */
export default function QrGenerator() {
  const [kind, setKind] = useState<Kind>("link");
  const [v, setV] = useState<Fields>({ url: "https://", security: "WPA" });
  const [style, setStyle] = useState<QrStyle>({ ...DEFAULT_STYLE, label: "Scan me" });
  const [size, setSize] = useState(1200);
  const text = useMemo(() => qrText(kind, v), [kind, v]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const field = (k: string, label: string, ph = "", type = "text") => (
    <div><label className="label" htmlFor={`qg-${k}`}>{label}</label><input id={`qg-${k}`} data-testid={`qg-${k}`} className="input" type={type} value={v[k] ?? ""} onChange={set(k)} placeholder={ph} /></div>
  );
  const area = (k: string, label: string, ph = "") => (
    <div><label className="label" htmlFor={`qg-${k}`}>{label}</label><textarea id={`qg-${k}`} data-testid={`qg-${k}`} className="input h-24" value={v[k] ?? ""} onChange={set(k)} placeholder={ph} /></div>
  );
  const name = `qr-${kind}`;
  const savePng = async () => download(await svgToPng(qrSvg(text, style, "M"), size), `${name}.png`, "image/png", false);
  const saveSvg = () => download(new Blob([qrSvg(text, style, "M").svg], { type: "image/svg+xml" }), `${name}.svg`, "image/svg+xml", false);

  return (
    <div className="space-y-5">
      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-lg font-bold">1. What should the QR code do?</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="QR code type">
          {KINDS.map((k) => (
            <button key={k.id} role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} data-testid={`qg-kind-${k.id}`}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-xs font-semibold transition ${kind === k.id ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-neutral-200 hover:border-neutral-900 dark:border-neutral-800"}`}>
              {k.label}<span className={`mt-0.5 hidden text-[10px] font-normal sm:block ${kind === k.id ? "opacity-70" : "text-neutral-500"}`}>{k.hint}</span>
            </button>))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {kind === "link" && <div className="sm:col-span-2">{field("url", "Website address", "https://yourshop.in", "url")}</div>}
          {kind === "text" && <div className="sm:col-span-2">{area("text", "Message", "Anything up to a few hundred characters")}</div>}
          {kind === "wifi" && <>
            {field("ssid", "Wi-Fi name (exactly as it appears)", "Home WiFi")}
            {v.security !== "nopass" && field("password", "Password", "")}
            <div><label className="label" htmlFor="qg-security">Security</label><select id="qg-security" className="input" value={v.security ?? "WPA"} onChange={set("security")}><option value="WPA">WPA / WPA2 / WPA3 (most routers)</option><option value="WEP">WEP (old routers)</option><option value="nopass">No password</option></select></div>
            <label className="flex min-h-[44px] items-center gap-2 self-end text-sm"><input type="checkbox" checked={v.hidden === "1"} onChange={(e) => setV((x) => ({ ...x, hidden: e.target.checked ? "1" : "" }))} /> Hidden network</label>
          </>}
          {(kind === "phone" || kind === "sms" || kind === "whatsapp") && field("phone", kind === "whatsapp" ? "WhatsApp number" : "Phone number", "98470 12345", "tel")}
          {(kind === "sms" || kind === "whatsapp") && area("message", "Ready message (optional)", kind === "whatsapp" ? "Hi, I want to order…" : "")}
          {kind === "email" && <>{field("to", "Email address", "shop@example.com", "email")}{field("subject", "Subject (optional)")}<div className="sm:col-span-2">{area("body", "Message (optional)")}</div></>}
          {kind === "location" && <>
            <div className="sm:col-span-2">{field("place", "Place or address", "Spice Garden, MG Road, Kochi")}</div>
            {field("lat", "Or latitude (optional)", "9.9312")}{field("lng", "Longitude (optional)", "76.2673")}
          </>}
        </div>
        <p className="text-xs text-neutral-500">Need a menu, coupon, business card or a page you can edit later? Use <Link className="font-semibold underline" href="/qr-studio">QR Code Studio</Link>. For payments, use the <Link className="font-semibold underline" href="/upi-qr-generator">UPI QR Generator</Link>.</p>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-lg font-bold">2. Design it</h2>
        {text ? <QrStyler text={text} style={style} onChange={setStyle} ecc="M" /> : <p className="rounded-xl bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-950" data-testid="qg-empty">{needs[kind]}</p>}
      </section>

      {text && (
        <section className="card space-y-3 p-4 sm:p-5" data-testid="qg-save">
          <h2 className="text-lg font-bold">3. Download</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn" onClick={savePng} data-testid="qg-png"><Download className="h-4 w-4" /> PNG</button>
            <select className="input !w-auto" value={size} onChange={(e) => setSize(+e.target.value)} aria-label="PNG size"><option value={600}>600 px (WhatsApp, web)</option><option value={1200}>1200 px (print small)</option><option value={2400}>2400 px (posters)</option></select>
            <button className="btn-ghost" onClick={saveSvg} data-testid="qg-svg"><Download className="h-4 w-4" /> SVG (for print shops)</button>
          </div>
          <p className="break-all text-xs text-neutral-500">Inside the code: <span className="font-mono">{text}</span></p>
          <p className="text-xs text-neutral-500">This QR code works forever: it holds the details itself and does not depend on ToolBox. Scan it with your own phone before you print.</p>
        </section>
      )}
    </div>
  );
}
