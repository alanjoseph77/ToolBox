"use client";
import { useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import CopyButton from "@/components/CopyButton";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { download } from "@/lib/files";

type Fmt = "text" | "markdown" | "html";
const meta: Record<Fmt, { label: string; ext: string; mime: string }> = { text: { label: "Plain text", ext: "txt", mime: "text/plain" }, markdown: { label: "Markdown", ext: "md", mime: "text/markdown" }, html: { label: "HTML", ext: "html", mime: "text/html" } };

export default function WordToText() {
  const [buf, setBuf] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState("document");
  const [fmt, setFmt] = useState<Fmt>("text");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const convert = async (b: ArrayBuffer, f: Fmt) => {
    setBusy(true); setError("");
    try {
      const m = mammoth as unknown as Record<string, (i: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>>;
      const r = f === "text" ? await m.extractRawText({ arrayBuffer: b }) : f === "html" ? await m.convertToHtml({ arrayBuffer: b }) : await m.convertToMarkdown({ arrayBuffer: b });
      setOut(r.value.trim() + "\n");
      if (!r.value.trim()) setError("No text was found in this document.");
    } catch { setError("Could not read this file. Is it a .docx document? Old .doc files are not supported."); setOut(""); }
    setBusy(false);
  };
  const load = async (f: File[]) => { if (!f[0]) return; if (/\.doc$/i.test(f[0].name)) { setError("Old .doc files are not supported. Save the file as .docx in Word first."); return; } const b = await f[0].arrayBuffer(); setBuf(b); setName(f[0].name.replace(/\.[^.]+$/, "")); await convert(b, fmt); };

  return (
    <div className="space-y-4">
      <Dropzone accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onFiles={load} hint="Add a Word (.docx) file. It stays on your device." />
      <WaterLoader active={busy} label="Reading your document…" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {buf && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Output format">{(Object.keys(meta) as Fmt[]).map((k) => <button key={k} aria-pressed={fmt === k} className={fmt === k ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => { setFmt(k); convert(buf, k); }}>{meta[k].label}</button>)}</div>
          {out && <>
            <textarea aria-label="Converted text" className="input h-72 w-full font-mono text-xs" value={out} onChange={(e) => setOut(e.target.value)} />
            <div className="flex flex-wrap gap-2"><CopyButton text={out} /><button className="btn" onClick={() => download(new Blob([out], { type: meta[fmt].mime }), `${name}.${meta[fmt].ext}`, meta[fmt].mime)}>Download .{meta[fmt].ext}</button></div>
          </>}
        </div>
      )}
      <p className="text-xs text-neutral-500">Images and complex layouts are not kept. Headings, lists, bold, italics, links and tables are kept in Markdown and HTML.</p>
    </div>
  );
}
