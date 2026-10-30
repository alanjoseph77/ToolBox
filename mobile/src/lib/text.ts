// Pure helpers (no native modules) so they can be unit-tested anywhere.

export function b64EncodeUtf8(s: string, urlSafe = false): string {
  const bin = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const b64 = btoa(bin);
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64;
}

export function b64DecodeUtf8(input: string): string {
  let b64 = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return decodeURIComponent(Array.from(bin, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
}

export function decodeJwt(token: string): { header: unknown; payload: Record<string, unknown> } {
  const [h, p] = token.trim().split(".");
  if (!h || !p) throw new Error("Not a valid JWT");
  return { header: JSON.parse(b64DecodeUtf8(h)), payload: JSON.parse(b64DecodeUtf8(p)) };
}

export function wordStats(text: string) {
  const words = (text.trim().match(/\S+/g) ?? []).length;
  return {
    words,
    characters: text.length,
    noSpaces: text.replace(/\s/g, "").length,
    sentences: (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    readingMinutes: Math.max(words ? 1 : 0, Math.ceil(words / 200)),
  };
}

export const unitTables: Record<string, Record<string, number>> = {
  Length: { Metre: 1, Kilometre: 1000, Centimetre: 0.01, Millimetre: 0.001, Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  Weight: { Kilogram: 1, Gram: 0.001, Milligram: 1e-6, Tonne: 1000, Pound: 0.45359237, Ounce: 0.028349523125, Quintal: 100 },
  Area: { "Sq metre": 1, "Sq km": 1e6, "Sq foot": 0.09290304, "Sq yard": 0.83612736, Acre: 4046.8564224, Hectare: 10000 },
  Volume: { Litre: 1, Millilitre: 0.001, "Cubic metre": 1000, Gallon: 3.785411784, Cup: 0.2365882365 },
  Speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, Knot: 0.514444 },
  Data: { Byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
};

const toC = (v: number, u: string) => (u === "Fahrenheit" ? ((v - 32) * 5) / 9 : u === "Kelvin" ? v - 273.15 : v);
const fromC = (v: number, u: string) => (u === "Fahrenheit" ? (v * 9) / 5 + 32 : u === "Kelvin" ? v + 273.15 : v);

export function convertUnit(category: string, value: number, from: string, to: string): number {
  if (category === "Temperature") return fromC(toC(value, from), to);
  const t = unitTables[category];
  return (value * t[from]) / t[to];
}

const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.?" };
export type PasswordOptions = { lower: boolean; upper: boolean; digits: boolean; symbols: boolean };

/** `randomBytes(n)` must return cryptographically secure bytes. */
export function makePassword(length: number, opts: PasswordOptions, randomBytes: (n: number) => Uint8Array): { password: string; entropyBits: number } {
  const active = (Object.keys(opts) as (keyof PasswordOptions)[]).filter((k) => opts[k]);
  if (!active.length) return { password: "", entropyBits: 0 };
  const randInt = (max: number) => {
    const limit = Math.floor(0x100000000 / max) * max; // rejection sampling avoids modulo bias
    for (;;) {
      const b = randomBytes(4);
      const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
      if (n < limit) return n % max;
    }
  };
  const pool = active.map((k) => SETS[k]).join("");
  const chars = active.map((k) => SETS[k][randInt(SETS[k].length)]); // at least one of each chosen type
  while (chars.length < length) chars.push(pool[randInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return { password: chars.join(""), entropyBits: Math.round(length * Math.log2(pool.length)) };
}

export function findMatches(pattern: string, flags: string, text: string) {
  const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  return [...text.matchAll(re)].slice(0, 300).map((m) => ({ text: m[0], index: m.index ?? 0, groups: m.slice(1) }));
}
