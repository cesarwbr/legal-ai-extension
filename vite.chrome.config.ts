import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

const fetchVersion = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html: string) {
      return html.replace(
        /__APP_VERSION__/,
        `v${process.env.npm_package_version}`,
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), fetchVersion()],
  build: {
    emptyOutDir: false,
    outDir: resolve(__dirname, "dist"),
    lib: {
      formats: ["iife"],
      entry: resolve(__dirname, "./background.ts"),
      name: "Cat Facts",
    },
    rollupOptions: {
      output: {
        entryFileNames: "background.global.js",
        extend: true,
      },
    },
  },
});
