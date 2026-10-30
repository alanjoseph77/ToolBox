"use client";
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { canvasToBlob, download } from "@/lib/files";

const formats = [
  { id: "CODE128", label: "Code 128 (any text)", sample: "TOOLBOX-2026" },
  { id: "EAN13", label: "EAN-13 (12–13 digits)", sample: "590123412345" },
  { id: "UPC", label: "UPC-A (11–12 digits)", sample: "12345678901" },
  { id: "CODE39", label: "Code 39", sample: "TOOLBOX" },
];

export default function BarcodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState(formats[0]);
  const [value, setValue] = useState(formats[0].sample);
  const [showText, setShowText] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      JsBarcode(canvasRef.current, value, { format: format.id, displayValue: showText, margin: 16, width: 3, height: 100 });
      setError("");
    } catch { setError("This value is not valid for the selected barcode type."); }
  }, [value, format, showText]);

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <select className="input" value={format.id} onChange={(e) => { const f = formats.find((x) => x.id === e.target.value)!; setFormat(f); setValue(f.sample); }}>
        {formats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <input className="input font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} /> Show text under barcode</label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <canvas ref={canvasRef} className={`max-w-full ${error ? "hidden" : ""}`} />
      <button className="btn w-full" disabled={!!error} onClick={async () => download(await canvasToBlob(canvasRef.current!, "image/png"), "barcode.png")}>Download PNG</button>
    </div>
  );
}
