import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        mcp: {
          blue: "#2563eb",
          blueSoft: "#dbeafe",
          slateBg: "#f8fafc",
          warning: "#f59e0b",
          success: "#16a34a",
          danger: "#dc2626"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
