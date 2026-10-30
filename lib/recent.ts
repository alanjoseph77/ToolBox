const KEY = "toolbox:recent";

export function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function addRecent(slug: string) {
  try {
    const next = [slug, ...getRecent().filter((s) => s !== slug)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage unavailable (private mode) */ }
}

export function clearRecent() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
