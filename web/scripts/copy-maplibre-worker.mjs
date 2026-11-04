// MapLibre 6 finds its worker via import.meta.url, which bundlers rewrite. Serve a copy from /public instead.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public/maplibre", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre/maplibre-gl-worker.mjs");
console.log("copied maplibre worker to public/maplibre/");
