"use client";
import { useMemo, useState } from "react";
import QrBox from "@/components/QrBox";
import { waLink } from "@/lib/qrText";

export default function WhatsappLinkGenerator() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("91");
  const [msg, setMsg] = useState("");
  const res = useMemo(() => { if (!phone.trim()) return { link: "", error: "" }; try { return { link: waLink(phone, msg, code), error: "" }; } catch (e) { return { link: "", error: (e as Error).message }; } }, [phone, msg, code]);
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <div><label className="label" htmlFor="cc">Country code</label><input id="cc" className="input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></div>
          <div><label className="label" htmlFor="ph">WhatsApp number</label><input id="ph" className="input" inputMode="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        <div><label className="label" htmlFor="wm">Message (optional)</label><textarea id="wm" className="input h-24" placeholder="Hi, I want to know more about…" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        {res.error && <p className="text-sm text-red-600">{res.error}</p>}
      </div>
      {res.link && <>
        <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-sm font-semibold">Your chat link</p><p className="break-all rounded bg-neutral-100 p-2 text-sm dark:bg-neutral-900" data-link="1">{res.link}</p>
          <div className="flex gap-2"><a className="btn" href={res.link} target="_blank" rel="noopener">Open in WhatsApp</a></div></div>
        <QrBox text={res.link} filename="whatsapp-qr.png" caption={res.link} copyLabel="Copy link" />
      </>}
    </div>
  );
}
