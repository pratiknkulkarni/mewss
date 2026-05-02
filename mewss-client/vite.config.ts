import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";
// import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true
    }),
    react(),
    tailwindcss(),
    // visualizer({
    //   template: "treemap",
    //   open: true,
    //   gzipSize: true,
    //   filename: "bundle-stats.html",
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    "proxy": {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
