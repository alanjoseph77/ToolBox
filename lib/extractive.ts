const STOP = new Set("about above after again also been before being between both could does doing during each from have having into just more most other over same should some such than that their them then there these they this those through under until very was were what when where which while will with would your".split(" "));

/** Quick on-device summary: keeps the highest-scoring sentences (by word frequency) in their original order. */
export function extractiveSummary(text: string, length: "short" | "medium" | "detailed", bullets: boolean): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = (clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [clean]).map((s) => s.trim()).filter((s) => s.length > 20);
  if (!sentences.length) return clean.slice(0, 300);
  const words = (s: string) => s.toLowerCase().match(/[a-zÀ-ɏ]{4,}/g)?.filter((w) => !STOP.has(w)) ?? [];
  const freq = new Map<string, number>();
  for (const s of sentences) for (const w of words(s)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const scored = sentences.map((s, i) => {
    const w = words(s);
    return { s, i, score: w.reduce((n, x) => n + (freq.get(x) ?? 0), 0) / Math.sqrt(w.length || 1) };
  });
  const n = Math.min(sentences.length, { short: 2, medium: 4, detailed: 7 }[length]);
  const picked = scored.sort((a, b) => b.score - a.score).slice(0, n).sort((a, b) => a.i - b.i).map((x) => x.s);
  return bullets ? picked.map((s) => `• ${s}`).join("\n") : picked.join(" ");
}
