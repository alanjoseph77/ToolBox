import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./tools/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3" } },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"] },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { opacity: "0", transform: "scale(.97)" }, "100%": { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(4%,6%,0) scale(1.12)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
      },
      animation: { "fade-up": "fadeUp .35s ease-out both", pop: "pop .15s ease-out both", float: "float 24s ease-in-out infinite", shimmer: "shimmer 8s linear infinite" },
      boxShadow: { soft: "0 1px 2px rgb(15 23 42 / .04), 0 8px 24px rgb(79 70 229 / .07)", glow: "0 10px 40px -8px rgb(124 92 255 / .45)" },
    },
  },
  plugins: [],
};
export default config;
