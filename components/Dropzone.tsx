"use client";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export default function Dropzone({ accept, multiple, onFiles, hint }: {
  accept: string; multiple?: boolean; hint?: string; onFiles: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${over ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white hover:border-brand-500"}`}
    >
      <Upload className="h-8 w-8 text-brand-600" />
      <p className="font-semibold">Tap to choose {multiple ? "files" : "a file"} or drop here</p>
      <p className="text-xs text-slate-500">{hint ?? "Files never leave your device."}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
