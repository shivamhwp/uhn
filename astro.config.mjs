// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "static",
  adapter: vercel(),
  integrations: [react()],
  experimental: {
    fonts: [
      {
        provider: fontProviders.fontshare(),
        name: "Switzer",
        cssVariable: "--font-switzer",
        weights: [300, 400, 500, 600, 700],
        styles: ["normal", "italic"],
        fallbacks: ["system-ui", "sans-serif"],
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  },
});
