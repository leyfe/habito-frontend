import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/habits/" : "/",
  plugins: [
    react({
      babel: { plugins: [] },
      fastRefresh: false,
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    minify: "terser",
    sourcemap: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));