// Cron helper: standard 5-field expressions (minute hour day-of-month month day-of-week). Supports * , - / and month/day names.
const NAMES: Record<string, string[]> = { 3: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 4: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] };
const RANGE: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Cron { sets: Set<number>[]; star: boolean[]; fields: string[] }

export function parseCron(expr: string): Cron {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) throw new Error("A cron expression has 5 parts: minute hour day month weekday.");
  const sets: Set<number>[] = [], star: boolean[] = [];
  f.forEach((part, i) => {
    const [lo, hi] = RANGE[i], s = new Set<number>(); star.push(part === "*" || part.startsWith("*/"));
    const val = (x: string) => { const nm = NAMES[i]?.indexOf(x.toLowerCase()); const n = nm !== undefined && nm >= 0 ? nm + (i === 3 ? 1 : 0) : Number(x); if (!/^[A-Za-z]+$|^\d+$/.test(x) || isNaN(n) || n < lo || n > hi) throw new Error(`"${x}" is not allowed in part ${i + 1} (${lo}–${hi}).`); return n; };
    for (const item of part.split(",")) {
      const [range, step] = item.split("/"), st = step === undefined ? 1 : Number(step);
      if (!(st >= 1)) throw new Error(`Bad step "${step}".`);
      let a: number, b: number;
      if (range === "*") { a = lo; b = hi; } else if (range.includes("-")) { const [x, y] = range.split("-"); a = val(x); b = val(y); } else { a = val(range); b = step === undefined ? a : hi; }
      if (a > b) throw new Error(`Range "${range}" goes backwards.`);
      for (let v = a; v <= b; v += st) s.add(i === 4 && v === 7 ? 0 : v);
    }
    sets.push(s);
  });
  return { sets, star, fields: f };
}

export function nextRuns(c: Cron, from: Date, count = 5): Date[] {
  const out: Date[] = [], d = new Date(from.getTime()); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  for (let guard = 0; out.length < count && guard < 600000; guard++, d.setMinutes(d.getMinutes() + 1)) {
    if (!c.sets[3].has(d.getMonth() + 1) || !c.sets[1].has(d.getHours()) || !c.sets[0].has(d.getMinutes())) continue;
    const dom = c.sets[2].has(d.getDate()), dow = c.sets[4].has(d.getDay());
    if (!(c.star[2] || c.star[4] ? dom && dow : dom || dow)) continue;           // cron rule: if both day fields are restricted, either may match
    out.push(new Date(d));
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");
export function explain(c: Cron): string {
  const [m, h, dom, mon, dow] = c.fields, parts: string[] = [];
  const stepOf = (x: string) => (x.startsWith("*/") ? Number(x.slice(2)) : 0), num = (x: string) => /^\d+$/.test(x);
  const hourRange = h.includes("-") && !h.includes(",") && !h.includes("/") ? h.split("-").map(Number) : null;
  const when = hourRange ? `between ${pad(hourRange[0])}:00 and ${pad(hourRange[1])}:59` : h === "*" ? "" : stepOf(h) ? `every ${stepOf(h)} hours` : num(h) ? "" : `at hour ${h}`;
  if (num(m) && num(h)) parts.push(`At ${pad(+h)}:${pad(+m)}`);
  else if (m === "*") parts.push(["Every minute", when].filter(Boolean).join(" "));
  else if (stepOf(m)) parts.push([`Every ${stepOf(m)} minutes`, when].filter(Boolean).join(", "));
  else parts.push([`At minute ${m.replace(/,/g, ", ")}`, h === "*" ? "of every hour" : when].filter(Boolean).join(" "));
  if (dom !== "*") parts.push(stepOf(dom) ? `every ${stepOf(dom)} days` : `on day ${dom} of the month`);
  const dn = (x: string) => (/^\d$/.test(x) ? DAYS[+x % 7] : x);
  if (dow !== "*") parts.push("on " + dow.split(",").map((x) => (x.includes("-") ? x.split("-").map(dn).join(" to ") : dn(x))).join(", "));
  if (mon !== "*") parts.push("in " + mon.split(",").map((x) => (/^\d+$/.test(x) ? MONTHS[+x - 1] : x)).join(", "));
  return parts.join(", ");
}
