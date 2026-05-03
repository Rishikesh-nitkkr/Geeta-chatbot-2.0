import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#05020d",
        lotus: "#7c3aed",
        peacock: "#00c2b8",
        saffron: "#f59e0b",
        antique: "#f6d07a",
        aura: "#d9b5ff"
      },
      boxShadow: {
        divine: "0 0 60px rgba(246, 208, 122, 0.24)",
        glass: "0 20px 60px rgba(0, 0, 0, 0.42)"
      },
      backgroundImage: {
        "radial-aura": "radial-gradient(circle at 50% 0%, rgba(246,208,122,0.25), transparent 34%), radial-gradient(circle at 10% 20%, rgba(124,58,237,0.2), transparent 32%)"
      }
    }
  },
  plugins: []
};

export default config;
