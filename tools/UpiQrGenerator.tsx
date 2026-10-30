"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import CopyButton from "@/components/CopyButton";
import { canvasToBlob, download } from "@/lib/files";
import { buildUpiLink } from "@/lib/upi";

export default function UpiQrGenerator() {
  const [vpa, setVpa] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vpa.trim()) { setLink(""); setQr(""); setError(""); return; }
    try {
      const l = buildUpiLink({ vpa, name, amount, note });
      setLink(l); setError("");
      QRCode.toDataURL(l, { width: 640, margin: 2, errorCorrectionLevel: "M" }).then(setQr);
    } catch (e) { setLink(""); setQr(""); setError((e as Error).message); }
  }, [vpa, name, amount, note]);

  /** A printable card: title, QR, payee and UPI ID. */
  const card = async () => {
    const c = document.createElement("canvas"); c.width = 900; c.height = 1180;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#000"; g.fillRect(0, 0, c.width, 14);
    g.textAlign = "center"; g.fillStyle = "#000"; g.font = "bold 64px sans-serif"; g.fillText("Scan & Pay", 450, 120);
    const img = new Image(); img.src = qr; await img.decode();
    g.drawImage(img, 130, 170, 640, 640);
    g.font = "bold 52px sans-serif"; g.fillText(name.trim() || vpa.trim(), 450, 900, 800);
    g.fillStyle = "#555"; g.font = "36px monospace"; g.fillText(vpa.trim(), 450, 960, 800);
    if (amount.trim()) { g.fillStyle = "#000"; g.font = "bold 56px sans-serif"; g.fillText(`₹ ${Number(amount).toFixed(2)}`, 450, 1050); }
    g.fillStyle = "#888"; g.font = "28px sans-serif"; g.fillText("Works with any UPI app", 450, 1130);
    download(await canvasToBlob(c, "image/png"), "upi-qr-card.png");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">UPI ID *</label><input className="input" value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="yourname@okbank" autoCapitalize="none" /></div>
        <div><label className="label">Name (optional)</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown to the payer" /></div>
        <div><label className="label">Amount ₹ (optional)</label><input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Leave empty to let the payer choose" /></div>
        <div className="sm:col-span-2"><label className="label">Note (optional)</label><input className="input" maxLength={50} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Invoice 1024" /></div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {qr ? (
        <div className="space-y-3 rounded-xl border bg-white p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="UPI payment QR code" className="mx-auto w-64 rounded-lg border bg-white p-2" />
          <div className="grid gap-2 sm:grid-cols-2">
            <a className="btn" href={qr} download="upi-qr.png">Download QR (PNG)</a>
            <button className="btn-ghost" onClick={card}>Download printable card</button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500"><span className="max-w-full truncate font-mono">{link}</span><CopyButton text={link} label="Copy link" /></div>
        </div>
      ) : !error && <p className="text-sm text-neutral-500">Enter your UPI ID to create your QR code.</p>}
      <p className="text-xs text-neutral-500">The code opens any UPI app (Google Pay, PhonePe, Paytm, BHIM and others) with the details filled in. Always make a ₹1 test payment before printing.</p>
    </div>
  );
}
