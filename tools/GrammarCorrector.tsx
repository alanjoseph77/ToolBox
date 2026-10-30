"use client";
import WaterLoader from "@/components/WaterLoader";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import CopyButton from "@/components/CopyButton";
import { callAi } from "@/lib/ai";

export default function GrammarCorrector() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState("keep");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setOut("");
    try { setOut(await callAi({ action: "grammar", text, tone })); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <AiNotice />
      <textarea className="input h-48" placeholder="Paste your text…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap gap-3">
        <select className="input !w-auto" value={tone} onChange={(e) => setTone(e.target.value)}><option value="keep">Keep my tone</option><option value="formal">Make it formal</option><option value="friendly">Make it friendly</option><option value="concise">Make it concise</option></select>
        <button className="btn" disabled={busy || !text.trim()} onClick={run}>{busy ? "Checking…" : "Fix grammar"}</button>
      </div>
      <WaterLoader active={busy} label="Polishing your text…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
      {out && <div className="space-y-2"><textarea readOnly className="input h-48" value={out} /><CopyButton text={out} /></div>}
    </div>
  );
}
