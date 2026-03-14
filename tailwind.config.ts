import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ft-cream": "#FFF1E0",
        "ft-black": "#1A1A1A",
        "ft-red": "#990F3D",
        "ft-teal": "#0D7680",
        "ft-mint": "#CCE8E4",
        "ft-grey": "#F2DFCE",
        "ft-border": "#E6D9CE",
        "ft-muted": "#807060",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
