import type { NextConfig } from "next";
import path from "node:path";

// Chloris is a client-rendered PWA over static JSON, so Cache Components /
// partial prefetching (scaffold defaults) are off. Serwist (Phase 4) may need webpack.
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
