"use client";
import { Fragment, useMemo, useState } from "react";

export default function RegexTester() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+)\\.com");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Contact: alice@example.com, bob@toolbox.com");

  const { matches, error } = useMemo(() => {
    try {
      if (!pattern) return { matches: [] as RegExpMatchArray[], error: "" };
      const f = flags.includes("g") ? flags : flags + "g";
      return { matches: [...text.matchAll(new RegExp(pattern, f))].slice(0, 500), error: "" };
    } catch (e) { return { matches: [] as RegExpMatchArray[], error: (e as Error).message }; }
  }, [pattern, flags, text]);

  const parts: { t: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of matches) {
    if (m[0] === "") continue;
    parts.push({ t: text.slice(last, m.index), hit: false }, { t: m[0], hit: true });
    last = m.index! + m[0].length;
  }
  parts.push({ t: text.slice(last), hit: false });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="input font-mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern" />
        <input className="input !w-24 font-mono" value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} placeholder="flags" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <textarea className="input h-32 font-mono" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="whitespace-pre-wrap rounded-lg border bg-white p-3 font-mono text-sm">
        {parts.map((p, i) => <Fragment key={i}>{p.hit ? <mark className="rounded bg-yellow-200">{p.t}</mark> : p.t}</Fragment>)}
      </div>
      <p className="text-sm font-semibold">{matches.length} match{matches.length === 1 ? "" : "es"}</p>
      <ul className="space-y-1 text-sm">
        {matches.map((m, i) => (
          <li key={i} className="rounded border bg-white p-2 font-mono">
            <b>#{i + 1}</b> “{m[0]}” at {m.index}
            {m.length > 1 && <span className="text-neutral-500"> · groups: {m.slice(1).map((g, k) => `$${k + 1}=${g ?? "∅"}`).join(", ")}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
