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
      className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition sm:py-14 ${over ? "scale-[1.01] border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-900" : "border-neutral-300 bg-white hover:border-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-black dark:hover:border-white dark:hover:bg-neutral-950"}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white transition group-hover:scale-105 dark:bg-white dark:text-black">
        <FileUp className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <p className="text-base font-semibold">Tap to choose {multiple ? "files" : "a file"}</p>
        <p className="mt-0.5 text-sm text-neutral-500">or drag and drop here</p>
      </div>
      <p className="max-w-sm text-xs text-neutral-400">{hint ?? "Files never leave your device."}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
