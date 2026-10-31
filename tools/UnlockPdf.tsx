"use client";
import { useState } from "react";
import { Info, Lock } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import WaterLoader from "@/components/WaterLoader";
import { canvasToBlob, download, formatBytes } from "@/lib/files";
import { jpegPagesToPdf } from "@/lib/pdfOps";
import { getPdfjs } from "@/lib/pdfjs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [need, setNeed] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ blob: Uint8Array; name: string; pages: number; note: string } | null>(null);

  const pick = (f: File[]) => { if (f[0]) { setFile(f[0]); setNeed(false); setWrong(false); setError(""); setDone(null); setPassword(""); } };

  const unlock = async (pw: string, f: File | null = file) => {
    if (!f) return;
    setBusy(true); setError(""); setWrong(false); setDone(null); setProgress(0);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      // A PDF with no encryption at all opens normally in pdf-lib, so there is nothing to unlock.
      let encrypted = false;
      try { if ((await PDFDocument.load(bytes.slice())).getPageCount() === 0) throw new Error("empty"); } catch (e) { encrypted = /encrypt/i.test((e as Error).message); if (!encrypted) throw e; }
      if (!encrypted) { setError("This PDF is not password protected, so there is nothing to remove."); setBusy(false); return; }

      const pdfjs = await getPdfjs();
      let pdf: any;
      try { pdf = await pdfjs.getDocument({ data: bytes.slice(), password: pw }).promise; }
      catch (e) {
        if ((e as { name?: string }).name === "PasswordException") { setNeed(true); setWrong(!!pw); setBusy(false); return; }
        throw e;
      }
      const pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i), base = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 2 });
        const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: g, viewport: vp }).promise;
        pages.push({ jpeg: new Uint8Array(await (await canvasToBlob(c, "image/jpeg", 0.9)).arrayBuffer()), widthPt: base.width, heightPt: base.height });
        setProgress(i / pdf.numPages);
      }
      const out = await jpegPagesToPdf(pages);
      setDone({ blob: out, name: f.name.replace(/\.pdf$/i, "") + "-unlocked.pdf", pages: pages.length, note: "" });
      setNeed(false);
    } catch { setError("Could not open this PDF. It may be damaged."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => { pick(f); if (f[0]) return unlock("", f[0]); }} hint="Add a password-protected PDF. It stays on your device." />
      {file && <div className="space-y-3 rounded-xl border bg-white p-4">
        <p className="text-sm">{file.name} · {formatBytes(file.size)}</p>
        {need && <div><label className="label" htmlFor="pw"><Lock className="mr-1 inline h-3.5 w-3.5" />Password</label>
          <input id="pw" type="password" className="input" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock(password)} />
          {wrong && <p className="mt-1 text-sm text-red-600" role="alert">That password is not correct. Try again.</p>}</div>}
        <button id="unlock-go" className="btn w-full" disabled={busy || (need && !password)} onClick={() => unlock(password)}>{busy ? "Unlocking…" : "Unlock PDF"}</button>
        <p className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> You need the password to open the file. If you do not know it, this tool cannot help. The unlocked copy keeps the pages as pictures, so the text can no longer be selected. Run PDF OCR on it if you need selectable text.</p>
      </div>}
      <WaterLoader active={busy} progress={progress || undefined} label="Unlocking your PDF…" hints={["Your PDF is opened on your device", "Nothing is uploaded", "Almost there…"]} />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {done && <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-sm" data-done="1">Unlocked {done.pages} page{done.pages === 1 ? "" : "s"} · {formatBytes(done.blob.length)}</p>
        <button className="btn w-full" onClick={() => download(done.blob, done.name, "application/pdf")}>Download {done.name}</button></div>}
    </div>
  );
}
