import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * aiforacademic.world — v2
 * Rewrites removed: /ric and /trans are now in-house.
 * Redirects added: /app → /workspace, /products → /tools
 */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tuyentranmd.com",
      },
    ],
  },
  async redirects() {
    return [
      // Legacy workspace
      { source: "/app", destination: "/workspace", permanent: true },
      { source: "/app/:path*", destination: "/workspace", permanent: true },
      // Legacy products hub
      { source: "/products", destination: "/tools", permanent: true },
      // Legacy external rewrites → in-house tools
      { source: "/ric", destination: "/tools/paper-checker", permanent: true },
      { source: "/ric/:path*", destination: "/tools/paper-checker", permanent: true },
      { source: "/trans", destination: "/tools/literature-review?tab=translate", permanent: true },
      { source: "/trans/:path*", destination: "/tools/literature-review?tab=translate", permanent: true },
    ];
  },
  // NOTE: rewrites to researchcheck.vercel.app and med-translator-swart.vercel.app
  // have been removed — tools are now in-house.
};

export default nextConfig;
