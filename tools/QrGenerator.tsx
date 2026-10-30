"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrGenerator() {
  const [text, setText] = useState("https://");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!text.trim()) { setUrl(""); return; }
    QRCode.toDataURL(text, { width: 600, margin: 2, color: { dark: fg, light: bg } }).then(setUrl).catch(() => setUrl(""));
  }, [text, fg, bg]);

  return (
    <div className="grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-2">
      <div className="space-y-3">
        <label className="label">Text or URL</label>
        <textarea className="input h-28" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-4">
          <label className="text-sm">Foreground <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="ml-1 align-middle" /></label>
          <label className="text-sm">Background <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="ml-1 align-middle" /></label>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="QR code" className="w-56 rounded-lg border" />
            <a className="btn w-full" href={url} download="qr-code.png">Download PNG</a>
          </>
        ) : <p className="text-sm text-neutral-400">Enter some text to generate a QR code.</p>}
      </div>
    </div>
  );
}
