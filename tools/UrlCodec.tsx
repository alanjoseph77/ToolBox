"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";

export default function UrlCodec() {
  const [input, setInput] = useState("");
  const [full, setFull] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (enc: boolean) => {
    try {
      setOutput(enc ? (full ? encodeURI(input) : encodeURIComponent(input)) : (full ? decodeURI(input) : decodeURIComponent(input)));
      setError("");
    } catch { setOutput(""); setError("Malformed input: could not decode."); }
  };

  return (
    <div className="space-y-3">
      <textarea className="input h-32 font-mono" placeholder="Paste text or a URL…" value={input} onChange={(e) => setInput(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} /> Treat as a full URL (keep : / ? &amp; = intact)</label>
      <div className="flex gap-2">
        <button className="btn" onClick={() => run(true)}>Encode</button>
        <button className="btn-ghost" onClick={() => run(false)}>Decode</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {output && <><textarea readOnly className="input h-32 font-mono" value={output} /><CopyButton text={output} /></>}
    </div>
  );
}
