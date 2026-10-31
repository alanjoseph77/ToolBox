"use client";
import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import PasteOrFile from "@/components/PasteOrFile";
import { parseCsv } from "@/lib/csv";
import { download } from "@/lib/files";
import { rowsToObjects } from "@/lib/sheet";

export default function CsvToJson() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [infer, setInfer] = useState(true);
  const [pretty, setPretty] = useState(true);
  const res = useMemo(() => {
    if (!text.trim()) return { out: "", error: "", count: 0 };
    try { const objs = rowsToObjects(parseCsv(text), infer); return { out: JSON.stringify(objs, null, pretty ? 2 : 0), error: "", count: objs.length }; }
    catch (e) { return { out: "", error: (e as Error).message, count: 0 }; }
  }, [text, infer, pretty]);
  return (
    <div className="space-y-4">
      <PasteOrFile accept=".csv,.tsv,.txt,text/csv,text/plain" value={text} onChange={(v, n) => { setText(v); if (n) setName(n.replace(/\.[^.]+$/, "")); }} label="CSV text" placeholder={"name,age,city\nAsha,29,Kochi"} />
      <div className="flex flex-wrap gap-4 rounded-xl border bg-white p-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={infer} onChange={(e) => setInfer(e.target.checked)} /> Turn numbers and true/false into JSON values</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} /> Pretty print</label>
      </div>
      {res.error && <p className="text-sm text-red-600" role="alert">{res.error}</p>}
      {res.out && <div className="space-y-2 rounded-xl border bg-white p-4"><p className="text-sm text-neutral-600" data-count="1">{res.count} objects</p>
        <textarea aria-label="JSON" readOnly className="input h-64 w-full font-mono text-xs" value={res.out} />
        <div className="flex gap-2"><CopyButton text={res.out} label="Copy JSON" /><button className="btn" onClick={() => download(new Blob([res.out], { type: "application/json" }), `${name}.json`, "application/json")}>Download .json</button></div></div>}
      <p className="text-xs text-neutral-500">The first row becomes the keys. Leading zeros and very long numbers stay as text so codes and IDs are not changed.</p>
    </div>
  );
}
