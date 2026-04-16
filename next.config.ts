import type { NextConfig } from "next";

/**
 * aiforacademic.world
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
  async rewrites() {
    return [
      { source: '/ric', destination: 'https://researchcheck.aiforacademic.world' },
      { source: '/ric/:path*', destination: 'https://researchcheck.aiforacademic.world/:path*' }
    ];
  }
};

export default nextConfig;
