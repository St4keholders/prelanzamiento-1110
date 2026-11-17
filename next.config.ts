import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Fonts and mascots read with fs by the share image route (Vercel must bundle them).
  outputFileTracingIncludes: {
    "/api/game/share-image": ["./assets/share/**/*"],
    "/api/ranking/image": ["./assets/share/**/*"],
    "/api/teams-card": ["./assets/share/**/*"],
    "/api/admin/team-card": ["./assets/share/**/*"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
