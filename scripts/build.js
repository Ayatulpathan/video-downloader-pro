import { build } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

async function runBuild() {
  console.log("Starting extension build...");

  // 1. Build Popup and Options pages (HTML + React app)
  console.log("Building HTML pages (popup, options)...");
  await build({
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve("src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve("popup.html"),
          options: resolve("options.html"),
        },
      },
    },
  });

  // 2. Build Content Script as standalone IIFE (No external chunk imports!)
  console.log("Building Content Script (standalone IIFE)...");
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": resolve("src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
        entry: resolve("src/content/content.ts"),
        name: "ContentScript",
        formats: ["iife"],
        fileName: () => "content.js",
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 3. Build Background Service Worker as standalone IIFE/ESM
  console.log("Building Service Worker...");
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": resolve("src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
        entry: resolve("src/background/service-worker.ts"),
        name: "ServiceWorker",
        formats: ["iife"],
        fileName: () => "background.js",
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 4. Ensure public assets (manifest.json, icons, test.html) are in dist
  console.log("Copying public assets...");
  if (!fs.existsSync("dist/icons")) {
    fs.mkdirSync("dist/icons", { recursive: true });
  }
  fs.copyFileSync("public/manifest.json", "dist/manifest.json");
  if (fs.existsSync("public/test.html")) {
    fs.copyFileSync("public/test.html", "dist/test.html");
  }
  const icons = fs.readdirSync("public/icons");
  for (const icon of icons) {
    fs.copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
  }

  console.log("Extension built successfully with zero external chunk dependencies for content/background!");
}

runBuild().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
