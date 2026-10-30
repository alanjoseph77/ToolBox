/** Parses "1-3, 5, 8-10" into zero-based page indices. */
export function parseRanges(input: string, total: number): number[] {
  const out: number[] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid range "${part}"`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside 1-${total}`);
    for (let p = a; p <= b; p++) out.push(p - 1);
  }
  if (!out.length) throw new Error("Enter at least one page or range");
  return out;
}
