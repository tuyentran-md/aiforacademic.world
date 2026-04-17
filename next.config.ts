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
      { source: '/ric', destination: 'https://researchcheck.vercel.app/ric' },
      { source: '/ric/:path*', destination: 'https://researchcheck.vercel.app/ric/:path*' },
    ];
  }
};

export default nextConfig;
