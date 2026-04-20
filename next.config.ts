import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * aiforacademic.world
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
  async rewrites() {
    return [
      // RIC — researchcheck (Next.js on Vercel, basePath=/ric)
      { source: '/ric', destination: 'https://researchcheck.vercel.app/ric' },
      { source: '/ric/:path*', destination: 'https://researchcheck.vercel.app/ric/:path*' },
      // Trans — med-translator (Next.js on Vercel, basePath=/trans)
      // Use med-translator-swart.vercel.app as the public alias (project default).
      { source: '/trans', destination: 'https://med-translator-swart.vercel.app/trans' },
      { source: '/trans/:path*', destination: 'https://med-translator-swart.vercel.app/trans/:path*' },
    ];
  }
};

export default nextConfig;
