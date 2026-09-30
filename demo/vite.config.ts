import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve("demo"),
  publicDir: resolve("demo/public"),
  resolve: {
    alias: [
      { find: "@/app/actions", replacement: resolve("demo/actions.ts") },
      { find: "next/navigation", replacement: resolve("demo/navigation.tsx") },
      { find: "next/link", replacement: resolve("demo/link.tsx") },
      { find: "next/dynamic", replacement: resolve("demo/dynamic.tsx") },
      { find: "@", replacement: resolve("src") },
    ],
  },
  build: { outDir: resolve("dist"), emptyOutDir: true },
});
