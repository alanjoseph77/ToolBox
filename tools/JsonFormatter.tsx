"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";

export default function JsonFormatter() {
  const [input, setInput] = useState('{"name":"ToolBox","tools":[1,2,3]}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (indent: number | undefined) => {
    try { setOutput(JSON.stringify(JSON.parse(input), null, indent)); setError(""); }
    catch (e) { setOutput(""); setError((e as Error).message); }
  };

  return (
    <div className="space-y-3">
      <textarea className="input h-48 font-mono" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => run(2)}>Format (2 spaces)</button>
        <button className="btn-ghost" onClick={() => run(4)}>Format (4 spaces)</button>
        <button className="btn-ghost" onClick={() => run(undefined)}>Minify</button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 font-mono text-sm text-red-700">Invalid JSON: {error}</p>}
      {output && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">✓ Valid JSON</p>
          <textarea readOnly className="input h-64 font-mono" value={output} />
          <CopyButton text={output} />
        </div>
      )}
    </div>
  );
}
