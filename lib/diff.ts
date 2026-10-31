export interface DiffOp { type: "same" | "del" | "add"; text: string }

/** Line-by-line difference between two lists of lines (longest common subsequence). Returns null when the inputs are too big. */
export function diffLines(a: string[], b: string[], limit = 25_000_000): DiffOp[] | null {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let ea = a.length, eb = b.length;
  while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
  const A = a.slice(s, ea), B = b.slice(s, eb), n = A.length, m = B.length;
  if ((n + 1) * (m + 1) > limit) return null;
  const w = m + 1, t = new Uint16Array((n + 1) * w);
  const cap = 65535;
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    t[i * w + j] = A[i] === B[j] ? Math.min(cap, t[(i + 1) * w + j + 1] + 1) : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
  const ops: DiffOp[] = a.slice(0, s).map((text) => ({ type: "same" as const, text }));
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { ops.push({ type: "same", text: A[i] }); i++; j++; }
    else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) ops.push({ type: "del", text: A[i++] });
    else ops.push({ type: "add", text: B[j++] });
  }
  while (i < n) ops.push({ type: "del", text: A[i++] });
  while (j < m) ops.push({ type: "add", text: B[j++] });
  for (const text of a.slice(ea)) ops.push({ type: "same", text });
  return ops;
}

/** Lines that differ are paired up (a removed line next to an added one) so they can sit side by side. */
export function sideBySide(ops: DiffOp[]): { left?: string; right?: string; changed: boolean }[] {
  const rows: { left?: string; right?: string; changed: boolean }[] = [];
  for (let k = 0; k < ops.length;) {
    if (ops[k].type === "same") { rows.push({ left: ops[k].text, right: ops[k].text, changed: false }); k++; continue; }
    const dels: string[] = [], adds: string[] = [];
    while (k < ops.length && ops[k].type !== "same") { (ops[k].type === "del" ? dels : adds).push(ops[k].text); k++; }
    for (let q = 0; q < Math.max(dels.length, adds.length); q++) rows.push({ left: dels[q], right: adds[q], changed: true });
  }
  return rows;
}
