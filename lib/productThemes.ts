// Colour themes for the customer's product page and the printable poster.
export type ThemeId = "clean" | "warm" | "fresh" | "royal" | "rose" | "ocean";
export interface Theme { id: ThemeId; name: string; bg: string; card: string; ink: string; muted: string; accent: string; accentInk: string }

export const THEMES: Theme[] = [
  { id: "clean", name: "Clean", bg: "#f5f5f4", card: "#ffffff", ink: "#0a0a0a", muted: "#525252", accent: "#111111", accentInk: "#ffffff" },
  { id: "warm", name: "Warm", bg: "#fff7ed", card: "#fffbf5", ink: "#431407", muted: "#7c2d12", accent: "#ea580c", accentInk: "#ffffff" },
  { id: "fresh", name: "Fresh", bg: "#f0fdf4", card: "#ffffff", ink: "#052e16", muted: "#166534", accent: "#16a34a", accentInk: "#ffffff" },
  { id: "royal", name: "Royal", bg: "#0b1220", card: "#16213a", ink: "#f8fafc", muted: "#cbd5e1", accent: "#d4af37", accentInk: "#1c1917" },
  { id: "rose", name: "Rose", bg: "#fff1f2", card: "#ffffff", ink: "#4c0519", muted: "#9f1239", accent: "#e11d48", accentInk: "#ffffff" },
  { id: "ocean", name: "Ocean", bg: "#ecfeff", card: "#ffffff", ink: "#082f49", muted: "#0e7490", accent: "#0284c7", accentInk: "#ffffff" },
];
export const THEME_IDS = THEMES.map((t) => t.id) as string[];
export const themeOf = (id: string | undefined): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
