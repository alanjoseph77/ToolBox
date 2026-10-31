"use client";
import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import PasteOrFile from "@/components/PasteOrFile";
import { toCsv } from "@/lib/csv";
import { download } from "@/lib/files";
import { objectsToRows } from "@/lib/sheet";

export default function JsonToCsv() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [delim, setDelim] = useState(",");
  const res = useMemo(() => {
    if (!text.trim()) return { out: "", error: "", rows: 0 };
    try {
      let data: unknown = JSON.parse(text);
      if (data && typeof data === "object" && !Array.isArray(data)) { const arr = Object.values(data).find(Array.isArray); if (arr) data = arr; } // { "items": [ ... ] }
      const rows = objectsToRows(data);
      return { out: toCsv(rows, delim), error: "", rows: rows.length - 1 };
    } catch (e) { return { out: "", error: e instanceof SyntaxError ? "This is not valid JSON: " + e.message : (e as Error).message, rows: 0 }; }
  }, [text, delim]);
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".json,application/json,.txt" value={text} onChange={(v, n) => { setText(v); if (n) setName(n.replace(/\.[^.]+$/, "")); }} label="JSON" placeholder={'[{"name":"Asha","age":29},{"name":"Ravi","age":31}]'} />
      <div className="rounded-xl border bg-white p-4 text-sm"><label className="flex items-center gap-2">Separator <select aria-label="Separator" className="input !w-36" value={delim} onChange={(e) => setDelim(e.target.value)}><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab</option></select></label></div>
      {res.error && <p className="text-sm text-red-600" role="alert">{res.error}</p>}
      {res.out && <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-sm text-neutral-600" data-count="1">{res.rows} rows</p>
        <textarea aria-label="CSV" readOnly className="input h-64 w-full font-mono text-xs" value={res.out} />
        <div className="flex gap-2"><CopyButton text={res.out} label="Copy CSV" /><button className="btn" onClick={() => download(new Blob(["﻿" + res.out], { type: "text/csv" }), `${name}.csv`, "text/csv")}>Download .csv</button></div></div>}
      <p className="text-xs text-neutral-500">Nested objects become columns such as address.city. Lists inside a row are kept as JSON text in one cell.</p>
    </div>
  );
}
