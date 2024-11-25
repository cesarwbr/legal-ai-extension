import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const fetchVersion = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html) {
      return html.replace(
        /__APP_VERSION__/,
        `v${process.env.npm_package_version}`
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), fetchVersion()],
  build: {
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: new URL("./index.html", import.meta.url).pathname,
        background: new URL("./background.html", import.meta.url).pathname,
        sidepanel: new URL("./sidepanel/index.html", import.meta.url).pathname,
      },
    },
  },
});
