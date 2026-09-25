// Tailwind config de juegaKino.
// Paleta: kino-red (marca), navy (superficies oscuras), gold (solo jackpot/premios), gray fría.
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Kino — Lotería de Concepción
        "kino-red": {
          50: "#FEF2F3",
          100: "#FDE2E5",
          200: "#FBC4CA",
          300: "#F79AA5",
          400: "#F16B7D",
          500: "#E8455C",
          600: "#E4002B", // rojo oficial del logotipo Kino
          700: "#C00025",
          800: "#9E001F",
          900: "#7D0018",
        },
        navy: {
          500: "#1B3A5C",
          600: "#142E49",
          700: "#0E2136",
          800: "#0A1929",
          900: "#071420",
        },
        // dorado SOLO para jackpot/premios
        gold: {
          300: "#E9C46A",
          400: "#D4AF37",
          500: "#B89425",
        },
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;