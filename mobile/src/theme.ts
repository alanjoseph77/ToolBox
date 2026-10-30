import { useColorScheme } from "react-native";

// Black & white palette that matches the website.
export const palette = {
  light: { bg: "#ffffff", card: "#ffffff", border: "#e5e5e5", text: "#0a0a0a", sub: "#737373", primary: "#171717", onPrimary: "#ffffff", muted: "#f5f5f5", danger: "#dc2626" },
  dark: { bg: "#000000", card: "#0a0a0a", border: "#262626", text: "#fafafa", sub: "#a3a3a3", primary: "#fafafa", onPrimary: "#000000", muted: "#171717", danger: "#f87171" },
};

export type Theme = typeof palette.light;

export function useScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useTheme(): Theme {
  return palette[useScheme()];
}
