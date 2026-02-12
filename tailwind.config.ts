import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090909",
        foreground: "#DBDBDB",
        accent: {
          DEFAULT: "#E84125",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#111111",
          foreground: "#DBDBDB",
        },
        muted: {
          DEFAULT: "#1a1a1a",
          foreground: "#888888",
        },
        border: "#222222",
        input: "#1a1a1a",
        ring: "#E84125",
        risk: {
          low: "#22c55e",
          moderate: "#eab308",
          high: "#f97316",
          extreme: "#ef4444",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
