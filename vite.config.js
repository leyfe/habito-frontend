import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Habito",
        short_name: "Habito",
        description: "Dein Habit- & To-Do-Tracker",
        theme_color: "#3c3c3c",           // Dark-Mode Theme
        background_color: "#3c3c3c",      // Hintergrund beim Start (Splashscreen)
        display: "standalone",
        display_override: ["standalone", "fullscreen"],
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        // 👇 iOS Meta-Hint (nur ergänzend)
        apple: {
          statusBarStyle: "black-translucent"
        }
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
});