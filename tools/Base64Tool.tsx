"use client";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";

const encode = (s: string, urlSafe: boolean) => {
  const bytes = new TextEncoder().encode(s);
  let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64;
};
const decode = (s: string) => {
  let b64 = s.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export default function Base64Tool() {
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (mode: "enc" | "dec") => {
    try { setOutput(mode === "enc" ? encode(input, urlSafe) : decode(input)); setError(""); }
    catch { setOutput(""); setError(mode === "dec" ? "That is not valid Base64 text." : "Could not encode this text."); }
  };

  return (
    <div className="space-y-3">
      <textarea className="input h-40 font-mono" placeholder="Enter text or Base64…" value={input} onChange={(e) => setInput(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} /> URL-safe alphabet (no padding)</label>
      <div className="flex gap-2">
        <button className="btn" onClick={() => run("enc")}>Encode</button>
        <button className="btn-ghost" onClick={() => run("dec")}>Decode</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {output && <><textarea readOnly className="input h-40 font-mono" value={output} /><CopyButton text={output} /></>}
    </div>
  );
}
