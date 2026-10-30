"use client";
import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

export default function Dropzone({ accept, multiple, onFiles, hint }: {
  accept: string; multiple?: boolean; hint?: string; onFiles: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ref.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition sm:py-14 ${over ? "scale-[1.01] border-brand-500 bg-brand-50 dark:bg-brand-500/15" : "border-slate-300/80 bg-white/60 backdrop-blur hover:border-brand-500 hover:bg-brand-50/60 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-brand-500/10"}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-fuchsia-500/15 text-brand-600 ring-1 ring-brand-500/20 transition group-hover:scale-105 dark:text-brand-200">
        <FileUp className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <p className="text-base font-semibold">Tap to choose {multiple ? "files" : "a file"}</p>
        <p className="mt-0.5 text-sm text-slate-500">or drag and drop here</p>
      </div>
      <p className="max-w-sm text-xs text-slate-400">{hint ?? "Files never leave your device."}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
