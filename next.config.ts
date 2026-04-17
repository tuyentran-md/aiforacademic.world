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
      // RIC — researchcheck (Next.js on Vercel, basePath=/ric)
      { source: '/ric', destination: 'https://researchcheck.vercel.app/ric' },
      { source: '/ric/:path*', destination: 'https://researchcheck.vercel.app/ric/:path*' },
      // Trans — med-translator (Next.js on Vercel, basePath=/trans)
      { source: '/trans', destination: 'https://med-translator.vercel.app/trans' },
      { source: '/trans/:path*', destination: 'https://med-translator.vercel.app/trans/:path*' },
    ];
  }
};

export default nextConfig;
