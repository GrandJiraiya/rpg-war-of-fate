/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// GitHub Pages serves the site from /rpg-war-of-fate/. Local dev stays at /.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === "build" ? "/rpg-war-of-fate/" : "/",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
