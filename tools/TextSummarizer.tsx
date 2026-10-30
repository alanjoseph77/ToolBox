"use client";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import CopyButton from "@/components/CopyButton";
import { callAi } from "@/lib/ai";

export default function TextSummarizer() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("medium");
  const [format, setFormat] = useState("prose");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setOut("");
    try { setOut(await callAi({ action: "summarize", text, length, format })); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <AiNotice />
      <textarea className="input h-56" placeholder="Paste the text to summarise…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap gap-3">
        <select className="input !w-auto" value={length} onChange={(e) => setLength(e.target.value)}><option value="short">Short</option><option value="medium">Medium</option><option value="detailed">Detailed</option></select>
        <select className="input !w-auto" value={format} onChange={(e) => setFormat(e.target.value)}><option value="prose">Paragraph</option><option value="bullets">Bullet points</option></select>
        <button className="btn" disabled={busy || text.trim().length < 20} onClick={run}>{busy ? "Summarising…" : "Summarise"}</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && <div className="space-y-2"><div className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm">{out}</div><CopyButton text={out} /></div>}
    </div>
  );
}
