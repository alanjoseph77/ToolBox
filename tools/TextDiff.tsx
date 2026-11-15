"use client";
import { useMemo, useState } from "react";
import { diffLines } from "@/lib/diff";

export default function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [trim, setTrim] = useState(false);
  const ops = useMemo(() => {
    if (!a && !b) return [];
    const norm = (s: string) => s.split(/\r?\n/).map((l) => (trim ? l.trim() : l));
    return diffLines(norm(a), norm(b));
  }, [a, b, trim]);
  const add = ops?.filter((o) => o.type === "add").length ?? 0, del = ops?.filter((o) => o.type === "del").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="label" htmlFor="da">Original text</label><textarea id="da" className="input h-56 font-mono text-sm" value={a} onChange={(e) => setA(e.target.value)} placeholder="Paste the old version here" /></div>
        <div><label className="label" htmlFor="db">Changed text</label><textarea id="db" className="input h-56 font-mono text-sm" value={b} onChange={(e) => setB(e.target.value)} placeholder="Paste the new version here" /></div>
      </div>
      <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} /> Ignore spaces at the start and end of each line</label>
      {ops === null && <p className="text-sm text-red-600">These texts are too large to compare in the browser. Try smaller pieces.</p>}
      {ops && ops.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm" data-testid="diff-summary">{add === 0 && del === 0 ? "The texts are identical." : <><b className="text-green-700">{add} added</b> · <b className="text-red-700">{del} removed</b></>}</p>
          <div className="overflow-x-auto rounded-xl border bg-white font-mono text-sm" data-testid="diff-out">
            {ops.map((o, i) => (
              <div key={i} className={`whitespace-pre-wrap px-3 py-0.5 ${o.type === "add" ? "bg-green-100 text-green-900" : o.type === "del" ? "bg-red-100 text-red-900" : ""}`}>
                <span className="select-none pr-2 text-neutral-400">{o.type === "add" ? "+" : o.type === "del" ? "−" : " "}</span>{o.text || " "}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
