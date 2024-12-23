import { resolve } from "path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: {
    "process.env": {},
  },
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, "dist"),
    lib: {
      formats: ["iife"],
      entry: resolve(__dirname, "./content-script/index.ts"),
      name: "NFL",
    },
    rollupOptions: {
      output: {
        entryFileNames: "content.js",
        extend: true,
      },
    },
  },
});
