"use client";
import { useEffect, useRef, useState } from "react";
import { matchesAccept, takePending } from "@/lib/handoff";
import { CheckCircle2, FileUp, X } from "lucide-react";
import PasteButton, { usePasteTarget } from "./PasteButton";

// Some systems hand over files without a MIME type, so fall back to the extension.
const EXT_TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska" };
const fits = (f: File, accept: string) => {
  if (/^\s*(\*|\*\/\*)?\s*$/.test(accept) || matchesAccept(f, accept)) return true;
  const t = f.type ? "" : EXT_TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""];
  return !!t && matchesAccept(new File([], f.name, { type: t }), accept);
};
const wanted = (accept: string) => /pdf/.test(accept) && /image/.test(accept) ? "a PDF or an image" : /pdf/.test(accept) ? "a PDF" : /image/.test(accept) ? "an image (JPG, PNG or WebP)" : /audio/.test(accept) && /video/.test(accept) ? "an audio or video file" : /audio/.test(accept) ? "an audio file" : /video/.test(accept) ? "a video" : /heic/.test(accept) ? "a HEIC photo" : /docx/.test(accept) ? "a Word (.docx) file" : /xlsx|csv/.test(accept) ? "an Excel (.xlsx) or CSV file" : "a supported file";

export default function Dropzone({ accept, multiple, onFiles, hint }: {
  accept: string; multiple?: boolean; hint?: string; onFiles: (files: File[]) => unknown;
}) {
  const [msg, setMsg] = useState("");
  // Checks the type, and catches errors from the tool so a bad file shows a message instead of failing silently.
  const deliver = async (list: File[], pasted = false) => {
    setMsg(""); showPasted([]);
    if (!list.length) return;
    const ok = list.filter((f) => fits(f, accept));
    if (!ok.length) { setMsg(`That file type is not supported here. Please choose ${wanted(accept)}.`); return; }
    if (ok.length < list.length) setMsg(`Skipped ${list.length - ok.length} file${list.length - ok.length === 1 ? "" : "s"} of the wrong type.`);
    try { await onFiles(ok); if (pasted) showPasted(ok); } catch { setMsg(`Could not open that file. It may be damaged, or not ${wanted(accept)}.`); }
  };
  // After a paste, show what was pasted (a thumbnail), so people can see it worked and it is the right picture.
  const [pastedList, setPastedList] = useState<{ url: string; name: string; info: string }[]>([]);
  const urls = useRef<string[]>([]);
  const showPasted = (files: File[]) => {
    urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current = [];
    const size = (n: number) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`;
    const list = files.map((f) => { const url = f.type.startsWith("image/") ? URL.createObjectURL(f) : ""; if (url) urls.current.push(url); return { url, name: f.name, info: size(f.size) }; });
    setPastedList(list);
    list.forEach((it, i) => { if (!it.url) return; const img = new Image(); img.onload = () => setPastedList((cur) => cur.map((c, j) => j === i && c.url === it.url ? { ...c, info: `${size(files[i].size)} · ${img.naturalWidth} × ${img.naturalHeight} px` } : c)); img.src = it.url; });
  };
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const ref = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  // Copy a picture anywhere, then Ctrl/Cmd+V (or the Paste button) puts it here. No need to save it first.
  usePasteTarget(box, (f) => void deliver(multiple ? f : f.slice(0, 1), true));
  const takesImages = /^\s*(\*|\*\/\*)?\s*$/.test(accept) || /image/.test(accept);
  // a file handed over from the previous tool (chaining) loads straight away
  useEffect(() => { const f = takePending(accept, window.location.pathname); if (f) void deliver([f]); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
    <div ref={box}
      role="button" tabIndex={0} data-testid="dropzone"
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
        <p className="mt-0.5 text-sm text-neutral-500">or drag and drop here{takesImages && <span className="hidden sm:inline">, or paste with Ctrl+V</span>}</p>
      </div>
      {takesImages && <PasteButton small onFiles={(f) => void deliver(multiple ? f : f.slice(0, 1), true)} label="Paste a copied image" />}
      <p className="max-w-sm text-xs text-neutral-400">{hint ?? "Files never leave your device."}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { void deliver(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
    {msg && <p role="alert" className="mt-2 text-sm text-red-600">{msg}</p>}
    {pastedList.length > 0 && (
      <div role="status" aria-live="polite" data-testid="pasted-preview" className="mt-3 flex animate-pop items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-black">
        <div className="flex shrink-0 -space-x-3">
          {pastedList.slice(0, 3).map((p) => p.url
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img key={p.url} src={p.url} alt="Pasted picture" className="h-16 w-16 rounded-xl border-2 border-white bg-[repeating-conic-gradient(#e5e5e5_0_25%,#fff_0_50%)] bg-[length:12px_12px] object-cover shadow-sm dark:border-black" />
            : <span key={p.name} className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white bg-neutral-100 text-[10px] font-bold uppercase dark:border-black dark:bg-neutral-900">{p.name.split(".").pop()}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-hidden />{pastedList.length > 1 ? `${pastedList.length} files pasted` : pastedList[0].url ? "Image pasted" : "File pasted"}</p>
          <p className="truncate text-xs text-neutral-500">{pastedList.length > 1 ? pastedList.map((p) => p.name).join(", ") : pastedList[0].name}</p>
          {pastedList.length === 1 && <p className="text-xs text-neutral-500">{pastedList[0].info}</p>}
        </div>
        <button type="button" onClick={() => showPasted([])} aria-label="Hide preview" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"><X className="h-4 w-4" /></button>
      </div>
    )}
    </>
  );
}
