export type Cell = string | number | boolean | Date | null | undefined;

/** A spreadsheet cell as plain text. Dates become yyyy-mm-dd, or with the time when there is one. */
export function cellText(v: Cell): string {
  if (v == null) return "";
  if (v instanceof Date) { const iso = v.toISOString(); return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.slice(0, 19).replace("T", " "); }
  return String(v);
}

/** Turns "123" into a number and "true" into a boolean; anything else stays text. */
export function guessType(s: string): string | number | boolean {
  const t = s.trim();
  if (/^-?(\d+|\d*\.\d+)$/.test(t) && !/^-?0\d/.test(t) && t.length < 16) return Number(t);
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === "true";
  return s;
}

/** First row as keys, the rest as objects. Repeated or empty headers are made unique. */
export function rowsToObjects(rows: string[][], infer = true): Record<string, unknown>[] {
  if (!rows.length) return [];
  const seen = new Map<string, number>();
  const keys = rows[0].map((h, i) => {
    const base = h.trim() || `column${i + 1}`, n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base}_${n}` : base;
  });
  return rows.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, infer ? guessType(r[i] ?? "") : (r[i] ?? "")])));
}

const flatten = (v: unknown, prefix: string, out: Record<string, unknown>) => {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) { for (const [k, x] of Object.entries(v)) flatten(x, prefix ? `${prefix}.${k}` : k, out); }
  else out[prefix] = Array.isArray(v) ? JSON.stringify(v) : v;
};

/** A list of objects as rows, with nested objects flattened to keys like address.city. */
export function objectsToRows(data: unknown): string[][] {
  const list = Array.isArray(data) ? data : [data];
  if (!list.length) throw new Error("The list is empty");
  const flat = list.map((o) => { const out: Record<string, unknown> = {}; if (o !== null && typeof o === "object" && !Array.isArray(o)) flatten(o, "", out); else out.value = o; return out; });
  const keys: string[] = [];
  for (const o of flat) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
  return [keys, ...flat.map((o) => keys.map((k) => (o[k] == null ? "" : String(o[k]))))];
}

/** Column letters for a zero-based index: 0 is A, 26 is AA. */
export const colName = (i: number): string => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
