"use client";
import { useMemo, useState } from "react";
import QrBox from "@/components/QrBox";
import { vcardString } from "@/lib/qrText";

export default function ContactQrGenerator() {
  const [f, setF] = useState({ first: "", last: "", org: "", title: "", phone: "", email: "", url: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const text = useMemo(() => { try { return vcardString(f); } catch { return ""; } }, [f]);
  const fields: [keyof typeof f, string, string][] = [["first", "First name", "text"], ["last", "Last name", "text"], ["org", "Company", "text"], ["title", "Job title", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"], ["url", "Website", "url"]];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        {fields.map(([k, label, type]) => <div key={k}><label className="label" htmlFor={`c-${k}`}>{label}</label><input id={`c-${k}`} type={type} className="input" value={f[k]} onChange={set(k)} /></div>)}
      </div>
      <QrBox text={text} filename="contact-qr.png" />
      {text && <p className="text-xs text-neutral-500">Scanning this with a phone camera offers to save the contact.</p>}
    </div>
  );
}
