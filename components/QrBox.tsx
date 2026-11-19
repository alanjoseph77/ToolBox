"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import QrStyler from "@/components/QrStyler";
import { DEFAULT_STYLE, qrSvg, svgToPng, type QrStyle } from "@/lib/qrStyle";
import { download } from "@/lib/files";

/** A QR for `text` with the full designer (shapes, colours, logo, frame) and PNG / SVG downloads. */
export default function QrBox({ text, filename, caption, copyLabel }: { text: string; filename: string; caption?: string; copyLabel?: string }) {
  const [style, setStyle] = useState<QrStyle>({ ...DEFAULT_STYLE, label: "Scan me" });
  if (!text) return null;
  const base = filename.replace(/\.png$/i, "");
  const png = async () => download(await svgToPng(qrSvg(text, style, "M"), 1200), `${base}.png`, "image/png", false);
  const svg = () => download(new Blob([qrSvg(text, style, "M").svg], { type: "image/svg+xml" }), `${base}.svg`, "image/svg+xml", false);
  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 dark:bg-black" data-testid="qrbox">
      <QrStyler text={text} style={style} onChange={setStyle} ecc="M" />
      {caption && <p className="break-all text-xs text-neutral-500">{caption}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={png} data-testid="qrbox-png"><Download className="h-4 w-4" /> Download PNG</button>
        <button className="btn-ghost" onClick={svg}><Download className="h-4 w-4" /> SVG (for print shops)</button>
        {copyLabel && <CopyButton text={caption ?? text} label={copyLabel} />}
      </div>
    </div>
  );
}
