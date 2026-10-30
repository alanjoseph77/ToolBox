"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";

export default function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const gen = () => setIds(Array.from({ length: count }, () => crypto.randomUUID()));
  const text = ids.map((i) => (upper ? i.toUpperCase() : i)).join("\n");

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><label className="label">How many (1–100)</label>
          <input type="number" min={1} max={100} className="input !w-28" value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, +e.target.value || 1)))} /></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase</label>
        <button className="btn" onClick={gen}>Generate</button>
      </div>
      {ids.length > 0 && <><textarea readOnly className="input h-56 font-mono" value={text} /><CopyButton text={text} label="Copy all" /></>}
    </div>
  );
}
