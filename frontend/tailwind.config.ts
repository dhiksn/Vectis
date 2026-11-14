import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--color-paper)",
          2: "var(--color-paper-2)",
          3: "var(--color-paper-3)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          2: "var(--color-ink-2)",
        },
        muted: "var(--color-muted)",
        rule: {
          DEFAULT: "var(--color-rule)",
          2: "var(--color-rule-2)",
        },
        graphite: {
          DEFAULT: "var(--color-graphite)",
          2: "var(--color-graphite-2)",
          ink: "var(--color-graphite-ink)",
          muted: "var(--color-graphite-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          2: "var(--color-accent-2)",
          wash: "var(--color-accent-wash)",
          ink: "var(--color-accent-ink)",
          edge: "var(--color-accent-edge)",
        },
        success: "var(--color-success)",
        error: "var(--color-error)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-outlier)", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        input: "var(--radius-input)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        key: "var(--shadow-key)",
        "key-accent": "var(--shadow-key-accent)",
        "key-press": "var(--shadow-key-press)",
      },
      letterSpacing: {
        display: "var(--tracking-display)",
      },
    },
  },
  plugins: [],
};

export default config;
