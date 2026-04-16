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
  async redirects() {
    return [
      { source: '/ric', destination: 'https://researchcheck.aiforacademic.world', permanent: false },
      { source: '/ric/:path*', destination: 'https://researchcheck.aiforacademic.world/:path*', permanent: false }
    ];
  }
};

export default nextConfig;
