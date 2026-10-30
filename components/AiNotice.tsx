"use client";
import { useEffect, useState } from "react";

/** Shows a notice when the server has no AI key configured. */
export default function AiNotice() {
  const [configured, setConfigured] = useState(true);
  useEffect(() => { fetch("/api/ai").then((r) => r.json()).then((d) => setConfigured(d.configured)).catch(() => {}); }, []);
  if (configured) return null;
  return <p className="rounded-lg bg-neutral-100 p-3 text-sm text-neutral-800">AI features aren&apos;t configured on this server yet. The site owner needs to set <code>ANTHROPIC_API_KEY</code>.</p>;
}
