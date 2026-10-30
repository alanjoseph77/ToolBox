"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";

/** Parses "1-3, 5, 8-10" into zero-based page indices. */
function parseRanges(input: string, total: number): number[] {
  const out: number[] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid range "${part}"`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside 1-${total}`);
    for (let p = a; p <= b; p++) out.push(p - 1);
  }
  if (!out.length) throw new Error("Enter at least one page or range");
  return out;
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [ranges, setRanges] = useState("");
  const [error, setError] = useState("");

  const pick = async (f: File[]) => {
    setError("");
    try {
      const doc = await PDFDocument.load(await f[0].arrayBuffer(), { ignoreEncryption: true });
      setFile(f[0]); setPages(doc.getPageCount());
    } catch { setError("That file is not a valid PDF."); }
  };

  const extract = async () => {
    try {
      const src = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      (await out.copyPages(src, parseRanges(ranges, pages))).forEach((p) => out.addPage(p));
      download(await out.save(), "extracted.pdf", "application/pdf");
      setError("");
    } catch (e) { setError((e as Error).message); }
  };

  const everyPage = async () => {
    const src = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
    for (let i = 0; i < pages; i++) {
      const out = await PDFDocument.create();
      out.addPage((await out.copyPages(src, [i]))[0]);
      download(await out.save(), `page-${i + 1}.pdf`, "application/pdf");
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={pick} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{file.name} · {pages} pages</p>
          <label className="label">Pages to extract (e.g. 1-3, 5, 8-10)</label>
          <input className="input" value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 5" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn flex-1" onClick={extract}>Extract pages</button>
            <button className="btn-ghost flex-1" onClick={everyPage}>Split every page</button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
