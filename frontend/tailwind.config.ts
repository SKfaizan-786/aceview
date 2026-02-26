import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: '#e0e5ec',
      },
      boxShadow: {
        'neu': '8px 8px 16px #b8bec7, -8px -8px 16px #ffffff',
        'neu-sm': '4px 4px 8px #b8bec7, -4px -4px 8px #ffffff',
        'neu-xs': '2px 2px 5px #b8bec7, -2px -2px 5px #ffffff',
        'neu-inset': 'inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff',
        'neu-inset-sm': 'inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff',
        'neu-flat': '6px 6px 12px #b8bec7, -6px -6px 12px #ffffff',
        'neu-pressed': 'inset 6px 6px 12px #b8bec7, inset -6px -6px 12px #ffffff',
      },
      borderRadius: {
        'neu': '20px',
        'neu-lg': '28px',
        'neu-xl': '36px',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
