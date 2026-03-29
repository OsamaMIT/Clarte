import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,svelte}", "./options.html"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 88%)",
        input: "hsl(214 32% 88%)",
        ring: "hsl(210 100% 50%)",
        background: "hsl(210 20% 98%)",
        foreground: "hsl(222 47% 11%)",
        primary: {
          DEFAULT: "hsl(210 100% 50%)",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: {
          DEFAULT: "hsl(214 32% 93%)",
          foreground: "hsl(222 47% 11%)"
        },
        muted: {
          DEFAULT: "hsl(214 32% 93%)",
          foreground: "hsl(215 20% 45%)"
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(210 40% 98%)"
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 47% 11%)"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      },
      boxShadow: {
        card: "0 18px 40px -23px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
} satisfies Config;
