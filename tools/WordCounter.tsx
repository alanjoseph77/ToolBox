"use client";
import { useState } from "react";

export default function WordCounter() {
  const [text, setText] = useState("");
  const words = (text.trim().match(/\S+/g) ?? []).length;
  const stats = [
    ["Words", words],
    ["Characters", text.length],
    ["No spaces", text.replace(/\s/g, "").length],
    ["Sentences", (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length],
    ["Paragraphs", text.split(/\n\s*\n/).filter((p) => p.trim()).length],
    ["Reading time", `${Math.max(words ? 1 : 0, Math.ceil(words / 200))} min`],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white p-3"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-slate-500">{k}</p></div>
        ))}
      </div>
      <textarea className="input h-64" placeholder="Type or paste your text…" value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
