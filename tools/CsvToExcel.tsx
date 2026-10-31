"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import PasteOrFile from "@/components/PasteOrFile";
import { download } from "@/lib/files";
import { parseCsv } from "@/lib/csv";
import { writeSheets } from "@/lib/xlsxIo";

export default function CsvToExcel() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [header, setHeader] = useState(true);
  const [asText, setAsText] = useState(false);
  const [delim, setDelim] = useState("auto");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const convert = async () => {
    setError(""); setDone("");
    try {
      const rows = parseCsv(text, delim === "auto" ? undefined : delim === "tab" ? "\t" : delim);
      if (!rows.length) throw new Error("There is no data to convert.");
      download(await writeSheets([{ name: "Sheet1", rows }], { header, asText }), `${name}.xlsx`);
      setDone(`${rows.length} rows and ${Math.max(...rows.map((r) => r.length))} columns saved to ${name}.xlsx`);
    } catch (e) { setError((e as Error).message || "Could not convert this file."); }
  };
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".csv,.tsv,.txt,text/csv,text/plain" value={text} onChange={(v, n) => { setText(v); if (n) setName(n.replace(/\.[^.]+$/, "")); setDone(""); }} label="CSV text" placeholder={"name,age,city\nAsha,29,Kochi"} />
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row is a header (bold)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={asText} onChange={(e) => setAsText(e.target.checked)} /> Keep every cell as text</label>
          <label className="flex items-center gap-2">Separator <select aria-label="Separator" className="input !w-32" value={delim} onChange={(e) => setDelim(e.target.value)}><option value="auto">Detect</option><option value=",">Comma</option><option value=";">Semicolon</option><option value="tab">Tab</option><option value="|">Pipe</option></select></label>
        </div>
        <button className="btn w-full" disabled={!text.trim()} onClick={convert}>Convert to Excel (.xlsx)</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {done && <p className="text-sm text-neutral-600" role="status">{done}</p>}
      </div>
      <p className="text-xs text-neutral-500">Numbers become real numbers so Excel can add them up. Tick Keep every cell as text to protect codes such as 007 or long IDs.</p>
    </div>
  );
}
