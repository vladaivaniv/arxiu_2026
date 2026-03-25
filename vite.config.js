import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function stripPagesFallback() {
  return {
    name: "strip-pages-fallback",
    apply: "build",
    enforce: "pre",
    transformIndexHtml(html) {
      return html.replace(
        /<!-- pages-fallback:start -->[\s\S]*?<!-- pages-fallback:end -->/g,
        "",
      );
    },
    generateBundle(_, bundle) {
      const htmlAsset = bundle["index.html"];
      if (htmlAsset && htmlAsset.type === "asset") {
        htmlAsset.source = htmlAsset.source
          .toString()
          .replace(/<!-- pages-dev-loader:start -->[\s\S]*?<!-- pages-dev-loader:end -->/g, "");
      }

      const entryChunk = bundle["assets/index.js"];
      if (entryChunk && entryChunk.type === "chunk") {
        entryChunk.code = entryChunk.code.replace(
          /window\.__PAGES_STATIC_BOOTSTRAP__\s*\|\|\s*/g,
          "",
        );
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), stripPagesFallback()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/index.css";
          }

          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
