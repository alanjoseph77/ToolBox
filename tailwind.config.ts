import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./tools/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: "#f5f5f5", 100: "#e5e5e5", 200: "#d4d4d4", 500: "#404040", 600: "#171717", 700: "#000000", 800: "#262626" } },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"] },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { opacity: "0", transform: "scale(.97)" }, "100%": { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(4%,6%,0) scale(1.12)" } },
        wave: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        bubble: { "0%": { transform: "translateY(0) scale(.6)", opacity: "0" }, "20%": { opacity: ".8" }, "100%": { transform: "translateY(-70px) scale(1)", opacity: "0" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
      },
      animation: { "fade-up": "fadeUp .35s ease-out both", pop: "pop .15s ease-out both", float: "float 24s ease-in-out infinite", wave: "wave 2.4s linear infinite", "wave-slow": "wave 4.2s linear infinite reverse", bubble: "bubble 2.6s ease-in infinite", shimmer: "shimmer 8s linear infinite" },
      boxShadow: { soft: "0 1px 2px rgb(0 0 0 / .04), 0 4px 16px rgb(0 0 0 / .05)", glow: "0 8px 28px rgb(0 0 0 / .14)" },
    },
  },
  plugins: [],
};
export default config;
