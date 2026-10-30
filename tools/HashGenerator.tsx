"use client";
import { useEffect, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { hashHex, hashNames, type HashName } from "@/lib/hash";

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Partial<Record<HashName, string>>>({});
  const [upper, setUpper] = useState(false);
  const [expected, setExpected] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      const bytes = file ? new Uint8Array(await file.arrayBuffer()) : new TextEncoder().encode(text);
      const entries = await Promise.all(hashNames.map(async (n) => [n, await hashHex(n, bytes)] as const));
      if (live) setHashes(Object.fromEntries(entries));
    })();
    return () => { live = false; };
  }, [text, file]);

  const show = (h: string) => (upper ? h.toUpperCase() : h);
  const exp = expected.trim().toLowerCase();
  const match = exp ? hashNames.find((n) => hashes[n] === exp) : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <label className="label">Text</label>
        <textarea className="input h-28 font-mono" value={text} onChange={(e) => { setText(e.target.value); setFile(null); }} placeholder="Type or paste text…" />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-500">or hash a file:</span>
          <input type="file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); if (e.target.files?.[0]) setText(""); }} />
          {file && <span className="text-neutral-600">{file.name}</span>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase hex</label>
      </div>
      <div className="space-y-2">
        {hashNames.map((n) => (
          <div key={n} className="rounded-xl border bg-white p-3">
            <div className="mb-1 flex items-center justify-between"><span className="text-xs font-bold uppercase text-neutral-500">{n}</span><CopyButton text={show(hashes[n] ?? "")} /></div>
            <p className="break-all font-mono text-sm" data-hash={n}>{hashes[n] ? show(hashes[n]!) : "…"}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-4">
        <label className="label">Compare with a hash you were given</label>
        <input className="input font-mono" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste the expected hash" />
        {exp && <p className={`mt-2 text-sm font-semibold ${match ? "" : "text-red-600"}`}>{match ? `✓ Match (${match})` : "✗ No match"}</p>}
      </div>
      <p className="text-xs text-neutral-500">MD5 and SHA-1 are fine for checking files but are not secure for passwords. Your data never leaves the browser.</p>
    </div>
  );
}
