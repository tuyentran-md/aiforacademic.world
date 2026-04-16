import type { NextConfig } from "next";

/**
 * Headless WordPress on Vercel
 *
 * WordPress is hosted separately (same domain via origin routing, or a
 * separate host). Set WORDPRESS_ORIGIN in Vercel env vars to the actual
 * WordPress server (e.g. https://wp.aiforacademic.world or the raw IP).
 *
 * The rewrites below proxy /wp-json/ and /wp-admin/ so WordPress still
 * works on the same domain when you visit aiforacademic.world/wp-admin.
 *
 * If WordPress is entirely on a different subdomain and you never need
 * it at aiforacademic.world/wp-*, remove the rewrites block.
 */
const WORDPRESS_ORIGIN =
  process.env.WORDPRESS_ORIGIN ?? "https://aiforacademic.world";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/wp-json/:path*",
        destination: `${WORDPRESS_ORIGIN}/wp-json/:path*`,
      },
      {
        source: "/wp-admin/:path*",
        destination: `${WORDPRESS_ORIGIN}/wp-admin/:path*`,
      },
      {
        source: "/wp-login.php",
        destination: `${WORDPRESS_ORIGIN}/wp-login.php`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aiforacademic.world",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
    ],
  },
};

export default nextConfig;
