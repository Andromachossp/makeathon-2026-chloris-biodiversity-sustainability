import type { NextConfig } from "next";
import path from "node:path";

// Chloris is a client-rendered PWA over static JSON, so Cache Components /
// partial prefetching (scaffold defaults) are off. Serwist (Phase 4) may need webpack.
const nextConfig: NextConfig = {
  reactCompiler: true,
  // Search and Priorities were merged into the Plants tab; old links keep working.
  async redirects() {
    return [
      { source: "/priorities", destination: "/plants", permanent: false },
      { source: "/search", destination: "/plants", permanent: false },
    ];
  },
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
