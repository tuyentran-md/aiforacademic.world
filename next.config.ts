import type { NextConfig } from "next";

/**
 * aiforacademic.world — static frontend for 3 tools (RIC | MedTranslate | AVR).
 *
 * No WordPress backend. Blog links point externally to tuyentranmd.com/blog.
 * Tool CTAs link to their deployed apps:
 *   - RIC:          https://check.aiforacademic.world
 *   - MedTranslate: https://translate.tuyentranmd.com
 *   - AVR:          coming soon
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tuyentranmd.com",
      },
    ],
  },
};

export default nextConfig;
