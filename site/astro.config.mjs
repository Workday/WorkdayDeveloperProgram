import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// The GitHub Pages URL lives in hub.config.json so it is set in one place.
const hub = JSON.parse(readFileSync(new URL("../hub.config.json", import.meta.url), "utf8"));
const pages = new URL(hub.pagesUrl);

export default defineConfig({
  site: pages.origin,
  base: pages.pathname,
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: [".."]
      }
    }
  }
});
