"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { cases } from "@/lib/textCase";

export default function TextCaseConverter() {
  const [text, setText] = useState("");
  const [active, setActive] = useState("Title Case");
  const out = text ? cases[active](text) : "";
  return (
    <div className="space-y-4">
      <textarea className="input h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste your text…" />
      <div className="flex flex-wrap gap-2">
        {Object.keys(cases).map((k) => <button key={k} className={k === active ? "btn !min-h-0 !py-1.5 !text-xs" : "btn-ghost !min-h-0 !py-1.5 !text-xs"} onClick={() => setActive(k)}>{k}</button>)}
      </div>
      {out && (
        <div className="space-y-2">
          <textarea readOnly className="input h-36" value={out} aria-label="Converted text" />
          <div className="flex gap-2"><CopyButton text={out} /><button className="btn-ghost !py-1.5" onClick={() => setText(out)}>Use as input</button></div>
        </div>
      )}
    </div>
  );
}
