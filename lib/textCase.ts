/** Splits text into lowercase words, understanding camelCase, snake_case, kebab-case and spaces. */
export function words(s: string): string[] {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(/[^A-Za-z0-9À-ɏ]+/).filter(Boolean).map((w) => w.toLowerCase());
}
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export const cases: Record<string, (s: string) => string> = {
  "UPPER CASE": (s) => s.toUpperCase(),
  "lower case": (s) => s.toLowerCase(),
  "Title Case": (s) => s.toLowerCase().replace(/(^|[\s\-_/([{"'])([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase()),
  "Sentence case": (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase()),
  camelCase: (s) => words(s).map((w, i) => (i ? cap(w) : w)).join(""),
  PascalCase: (s) => words(s).map(cap).join(""),
  snake_case: (s) => words(s).join("_"),
  "kebab-case": (s) => words(s).join("-"),
  CONSTANT_CASE: (s) => words(s).join("_").toUpperCase(),
  "dot.case": (s) => words(s).join("."),
  "aLtErNaTiNg": (s) => Array.from(s.toLowerCase()).map((c, i) => (i % 2 ? c.toUpperCase() : c)).join(""),
  "Reverse text": (s) => Array.from(s).reverse().join(""),
  "Remove extra spaces": (s) => s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
  "slug-for-urls": (s) => words(s.normalize("NFD").replace(/[̀-ͯ]/g, "")).join("-"),
};
