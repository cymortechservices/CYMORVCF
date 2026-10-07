import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#07080d", brand: { DEFAULT: "#7c5cff", soft: "#a78bfa", mint: "#34d399" } } } },
  plugins: [],
} satisfies Config;
