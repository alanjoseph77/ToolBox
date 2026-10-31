"use client";
import { useEffect, useRef, useState } from "react";
import { matchesAccept, takePending } from "@/lib/handoff";
import { FileUp } from "lucide-react";

// Some systems hand over files without a MIME type, so fall back to the extension.
const EXT_TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska" };
const fits = (f: File, accept: string) => {
  if (/^\s*(\*|\*\/\*)?\s*$/.test(accept) || matchesAccept(f, accept)) return true;
  const t = f.type ? "" : EXT_TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""];
  return !!t && matchesAccept(new File([], f.name, { type: t }), accept);
};
const wanted = (accept: string) => /pdf/.test(accept) && /image/.test(accept) ? "a PDF or an image" : /pdf/.test(accept) ? "a PDF" : /image/.test(accept) ? "an image (JPG, PNG or WebP)" : /audio/.test(accept) && /video/.test(accept) ? "an audio or video file" : /audio/.test(accept) ? "an audio file" : /video/.test(accept) ? "a video" : /heic/.test(accept) ? "a HEIC photo" : /docx/.test(accept) ? "a Word (.docx) file" : "a supported file";

export default function Dropzone({ accept, multiple, onFiles, hint }: {
  accept: string; multiple?: boolean; hint?: string; onFiles: (files: File[]) => unknown;
}) {
  const [msg, setMsg] = useState("");
  // Checks the type, and catches errors from the tool so a bad file shows a message instead of failing silently.
  const deliver = async (list: File[]) => {
    setMsg("");
    if (!list.length) return;
    const ok = list.filter((f) => fits(f, accept));
    if (!ok.length) { setMsg(`That file type is not supported here. Please choose ${wanted(accept)}.`); return; }
    if (ok.length < list.length) setMsg(`Skipped ${list.length - ok.length} file${list.length - ok.length === 1 ? "" : "s"} of the wrong type.`);
    try { await onFiles(ok); } catch { setMsg(`Could not open that file. It may be damaged, or not ${wanted(accept)}.`); }
  };
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // a file handed over from the previous tool (chaining) loads straight away
  useEffect(() => { const f = takePending(accept, window.location.pathname); if (f) void deliver([f]); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
    <div
      role="button" tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ref.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void deliver(Array.from(e.dataTransfer.files)); }}
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
        onChange={(e) => { void deliver(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
    {msg && <p role="alert" className="mt-2 text-sm text-red-600">{msg}</p>}
    </>
  );
}
