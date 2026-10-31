"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import CopyButton from "@/components/CopyButton";
import { canvasToBlob, download } from "@/lib/files";

/** Draws a QR for `text` with a PNG download, and optionally shows and copies the text itself. */
export default function QrBox({ text, filename, caption, copyLabel }: { text: string; filename: string; caption?: string; copyLabel?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!text) { setUrl(""); return; }
    QRCode.toDataURL(text, { width: 640, margin: 2, errorCorrectionLevel: "M" }).then(setUrl).catch(() => setUrl(""));
  }, [text]);
  if (!text || !url) return null;
  const save = async () => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d")!.drawImage(img, 0, 0);
    download(await canvasToBlob(c, "image/png"), filename);
  };
  return (
    <div className="space-y-3 rounded-xl border bg-white p-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="QR code" className="mx-auto w-56 rounded-lg border bg-white" />
      {caption && <p className="break-all text-xs text-neutral-500">{caption}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn" onClick={save}>Download QR (PNG)</button>
        {copyLabel && <CopyButton text={caption ?? text} label={copyLabel} />}
      </div>
    </div>
  );
}
