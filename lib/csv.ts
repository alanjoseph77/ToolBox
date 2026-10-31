/** Picks the delimiter that appears most in the first lines (comma, semicolon, tab or pipe). */
export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 10).join("\n");
  let best = ",", bestN = -1;
  for (const d of [",", ";", "\t", "|"]) { const n = sample.split(d).length - 1; if (n > bestN) { best = d; bestN = n; } }
  return best;
}

/** Parses CSV text (quotes, doubled quotes and line breaks inside quotes are handled). */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"' && cell === "") q = true;
    else if (c === delimiter) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  if (q) throw new Error("A quoted value is never closed");
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Writes rows as CSV, quoting values that need it. */
export function toCsv(rows: unknown[][], delimiter = ","): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    return s.includes(delimiter) || /["\n\r]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(delimiter)).join("\n") + "\n";
}
