"use client";
import { useMemo, useState } from "react";

const b64url = (s: string) => {
  let b = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0))));
};

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const result = useMemo(() => {
    if (!token.trim()) return null;
    try {
      const [h, p] = token.trim().split(".");
      if (!h || !p) throw new Error();
      return { header: b64url(h), payload: b64url(p) };
    } catch { return "error" as const; }
  }, [token]);

  const exp = result && result !== "error" && typeof result.payload.exp === "number" ? new Date(result.payload.exp * 1000) : null;

  return (
    <div className="space-y-3">
      <textarea className="input h-32 font-mono" placeholder="Paste a JWT (eyJ…)" value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} />
      {result === "error" && <p className="text-sm text-red-600">This does not look like a valid JWT.</p>}
      {result && result !== "error" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className="label">Header</p><pre className="overflow-auto rounded-lg bg-white p-3 text-xs border">{JSON.stringify(result.header, null, 2)}</pre></div>
          <div><p className="label">Payload</p><pre className="overflow-auto rounded-lg bg-white p-3 text-xs border">{JSON.stringify(result.payload, null, 2)}</pre></div>
          {exp && <p className={`text-sm font-semibold sm:col-span-2 ${exp < new Date() ? "text-red-600" : "text-green-700"}`}>{exp < new Date() ? "Expired" : "Valid until"} {exp.toLocaleString()}</p>}
          <p className="text-xs text-slate-500 sm:col-span-2">The signature is not verified. Decoding happens only in your browser.</p>
        </div>
      )}
    </div>
  );
}
