/**
 * WordPress REST API helpers for aiforacademic.world
 *
 * Posts live in WordPress at aiforacademic.world.
 * This module fetches from the public REST API and normalises
 * the WP response into the BlogPost shape used by the UI.
 */

import type { WPPost, BlogPost } from "./types";

const WP_API = "https://aiforacademic.world/wp-json/wp/v2";

/** Strip HTML tags and decode basic entities for plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalise a raw WP post into a BlogPost */
function normalise(wp: WPPost): BlogPost {
  // Pull first category from embedded terms
  const terms = wp._embedded?.["wp:term"]?.[0] ?? [];
  const category =
    terms.find((t) => t.taxonomy === "category" && t.slug !== "uncategorized")
      ?.name ?? "General";

  // Featured image (if embedded)
  const featuredMedia =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wp._embedded as any)?.["wp:featuredmedia"]?.[0]?.source_url as
      | string
      | undefined;

  return {
    slug: wp.slug,
    title: stripHtml(wp.title.rendered),
    excerpt: stripHtml(wp.excerpt.rendered),
    content: wp.content.rendered,
    category,
    date: wp.date,
    featuredImage: featuredMedia,
  };
}

/**
 * Fetch all published posts (up to 100).
 * Uses ISR: revalidates every hour.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?_embed&per_page=100&status=publish&orderby=date&order=desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const posts: WPPost[] = await res.json();
    return posts.map(normalise);
  } catch {
    return [];
  }
}

/**
 * Fetch a single post by slug.
 * Uses ISR: revalidates every hour.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `${WP_API}/posts?_embed&slug=${encodeURIComponent(slug)}&status=publish`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const posts: WPPost[] = await res.json();
    if (!posts.length) return null;
    return normalise(posts[0]);
  } catch {
    return null;
  }
}

/** Format ISO date → "Mar 2026" */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
