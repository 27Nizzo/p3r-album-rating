import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        persona: {
          dark: "#050A1F",      // Azul quase preto
          blue: "#0A46D2",      // Azul oceânico
          cyan: "#00E5FF",      // Ciano brilhante
          white: "#F5F7FA",     // Branco azulado
          glass: "rgba(10, 70, 210, 0.3)",
        }
      },
      backgroundImage: {
        'p3-gradient': 'linear-gradient(135deg, #050A1F 0%, #0A46D2 100%)',
      }
    },
  },
  plugins: [],
};
export default config;