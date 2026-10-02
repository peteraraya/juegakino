// Tailwind config de juegaKino.
//
// Los valores viven en /context/design-tokens.md — este archivo es su IMPLEMENTACIÓN.
// Cada token de color apunta a una variable CSS definida en src/styles/index.css, que
// se re-declara en `@media (prefers-color-scheme: dark)`. Así el dark mode no necesita
// JS ni un toggle: es una cascada de CSS.
//
// Patrón de nombres:
//   paper / surface   → fondos
//   ink-500..900      → texto (oscurece al bajar el número)
//   line*             → bordes decorativos; line-control es el único con significado
//   accent-*          → kino-red, ÚNICO acento decorativo. Ver design-tokens.md §5
//   success/warning/danger/info → estado, nunca decoración
//   navy-* / gold-*   → superficies institucionales y premio (exclusivo)
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken) / <alpha-value>)",
        },
        ink: {
          900: "rgb(var(--ink-900) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
          control: "rgb(var(--line-control) / <alpha-value>)",
        },

        // --- Kino. Único acento decorativo del producto. ---
        // accent-fill es SOLO relleno (botón, bolilla). Texto → accent-text.
        // Ver design-tokens.md §5 "Regla de asignación".
        accent: {
          fill: "rgb(var(--accent-fill) / <alpha-value>)",
          "fill-hover": "rgb(var(--accent-fill-hover) / <alpha-value>)",
          text: "rgb(var(--accent-text) / <alpha-value>)",
          "text-strong": "rgb(var(--accent-text-strong) / <alpha-value>)",
          tint: "rgb(var(--accent-tint) / <alpha-value>)",
          line: "rgb(var(--accent-line) / <alpha-value>)",
        },

        // --- Estado. Comunican estado, no decoran. ---
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          tint: "rgb(var(--success-tint) / <alpha-value>)",
          ink: "rgb(var(--success-ink) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          tint: "rgb(var(--warning-tint) / <alpha-value>)",
          ink: "rgb(var(--warning-ink) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          tint: "rgb(var(--danger-tint) / <alpha-value>)",
          ink: "rgb(var(--danger-ink) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          tint: "rgb(var(--info-tint) / <alpha-value>)",
          ink: "rgb(var(--info-ink) / <alpha-value>)",
        },

        // --- Institucionales. Sin variantes dark: son un par propio. ---
        navy: {
          800: "rgb(var(--navy-800) / <alpha-value>)",
          900: "rgb(var(--navy-900) / <alpha-value>)",
        },
        // gold es EXCLUSIVO de premio/pozo. Sobre superficie clara NO usarlo como
        // texto ni borde (#B89425 sobre blanco = 2.88:1). Ver design-tokens.md §7.
        gold: {
          300: "rgb(var(--gold-300) / <alpha-value>)",
          400: "rgb(var(--gold-400) / <alpha-value>)",
        },
      },

      fontFamily: {
        // Tres familias por rol. Una familia nueva es una decisión de identidad.
        display: ['"Newsreader"', "Georgia", "Times New Roman", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      // Escala limitada a 8 tokens. 12px es el piso absoluto (nada más chico), en dos
      // variantes: eyebrow (con tracking, para rótulos) y data (sin tracking, para
      // cifras densas y glifos). Ver design-tokens.md §8.
      fontSize: {
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        // data es el piso de 12px SIN tracking: glifos de estado y cifras densas.
        // Existe para no inventar `text-[10px]` (fuera de la escala) ni usar
        // eyebrow, cuyo tracking ensancha justo lo que debe ser compacto.
        data: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0" }],
        small: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0" }],
        body: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        h3: ["1.125rem", { lineHeight: "1.35", letterSpacing: "0" }],
        h2: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        display: ["3rem", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      },

      // Un solo radio por categoría de componente — no se mezclan en la misma familia.
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
      },

      // shadow-none es el default del producto. sm solo para lo que flota sobre
      // contenido (tooltip, menu); lg solo para el scrim del dialog.
      boxShadow: {
        float: "0 1px 2px rgb(28 25 23 / 0.06), 0 4px 12px rgb(28 25 23 / 0.08)",
        scrim: "0 8px 32px rgb(28 25 23 / 0.16)",
      },

      maxWidth: {
        // Medida de línea cómoda a 16px: 60–75 caracteres.
        prose: "45rem",
        // Herramienta con sidebar (Generador, Simulador, Comparador, Pesos).
        tool: "80rem",
        // Dashboard / tablas de 5+ columnas.
        dashboard: "90rem",
      },

      transitionTimingFunction: {
        // Ver design-tokens.md §10.
        smooth: "cubic-bezier(0.2, 0, 0.2, 1)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.2, 0, 0.2, 1)",
        "slide-up": "slide-up 200ms cubic-bezier(0.2, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;