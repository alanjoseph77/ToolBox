"use client";
import WaterLoader from "@/components/WaterLoader";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import CopyButton from "@/components/CopyButton";
import { callAi } from "@/lib/ai";
import { extractiveSummary } from "@/lib/extractive";

export default function TextSummarizer() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("medium");
  const [format, setFormat] = useState("prose");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setOut(""); setNote("");
    try { setOut(await callAi({ action: "summarize", text, length, format })); }
    catch { // AI service unavailable: fall back to a quick on-device summary
      setOut(extractiveSummary(text, length as "short" | "medium" | "detailed", format === "bullets"));
      setNote("The AI service is busy, so this is a quick on-device summary instead.");
    }
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
      <WaterLoader active={busy} label="Summarising…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
      {note && <p className="text-sm text-neutral-500">{note}</p>}
      {out && <div className="space-y-2"><div className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm">{out}</div><CopyButton text={out} /></div>}
    </div>
  );
}
