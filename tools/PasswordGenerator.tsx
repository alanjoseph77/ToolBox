"use client";
import { useEffect, useState } from "react";
import CopyButton from "@/components/CopyButton";

const sets = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

/** Unbiased random int in [0, max) using rejection sampling. */
function randInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % max;
}

export default function PasswordGenerator() {
  const [len, setLen] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [pw, setPw] = useState("");

  const gen = () => {
    const active = (Object.keys(opts) as (keyof typeof sets)[]).filter((k) => opts[k]);
    if (!active.length) { setPw(""); return; }
    const pool = active.map((k) => sets[k]).join("");
    const chars = active.map((k) => sets[k][randInt(sets[k].length)]); // guarantee one of each type
    while (chars.length < len) chars.push(pool[randInt(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    setPw(chars.join(""));
  };
  useEffect(gen, [len, opts]); // eslint-disable-line react-hooks/exhaustive-deps

  const poolSize = (Object.keys(opts) as (keyof typeof sets)[]).filter((k) => opts[k]).reduce((n, k) => n + sets[k].length, 0);
  const bits = poolSize ? Math.round(len * Math.log2(poolSize)) : 0;
  const strength = bits >= 100 ? "Very strong" : bits >= 70 ? "Strong" : bits >= 50 ? "Fair" : "Weak";

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <div className="break-all rounded-lg bg-slate-100 p-3 font-mono text-lg">{pw || "Select at least one option"}</div>
      <p className="text-sm text-slate-600">{strength} · about {bits} bits of entropy</p>
      <div><label className="label">Length: {len}</label>
        <input type="range" min={6} max={64} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full" /></div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {(Object.keys(opts) as (keyof typeof opts)[]).map((k) => (
          <label key={k} className="flex items-center gap-2 capitalize"><input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} /> {k}</label>
        ))}
      </div>
      <div className="flex gap-2"><button className="btn" onClick={gen}>Regenerate</button><CopyButton text={pw} /></div>
    </div>
  );
}
