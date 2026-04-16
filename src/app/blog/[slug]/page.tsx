import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getBlogPost, fmtDate } from "@/lib/wp";

// Dynamic rendering — content is live from WordPress
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };

  const description = post.excerpt.slice(0, 160);
  const canonical = `https://aiforacademic.world/blog/${slug}`;
  const ogImage =
    post.featuredImage ||
    `https://aiforacademic.world/og?title=${encodeURIComponent(post.title)}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.date,
      authors: ["Tuyến Trần"],
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-stone-400 text-sm">Post not found.</p>
        <Link href="/blog" className="text-xs text-stone-500 underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const date = fmtDate(post.date);

  // Reading time estimate
  const wordCount = post.content
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const readingMins = Math.max(1, Math.round(wordCount / 200));

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: [
      {
        "@type": "Person",
        name: "Tuyến Trần",
        url: "https://tuyentranmd.com",
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "AI for Academic",
      url: "https://aiforacademic.world",
    },
    description: post.excerpt,
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F2EC" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Back link ── */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2">
        <Link
          href="/blog"
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          ← Blog
        </Link>
      </div>

      {/* ── Article ── */}
      <article className="max-w-2xl mx-auto px-6 pb-24">
        {/* Meta */}
        <div className="flex items-center gap-3 mt-6 mb-6 flex-wrap">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#D4E8F5", color: "#2E5A80" }}
          >
            {post.category}
          </span>
          <span className="text-xs text-stone-400">{date}</span>
          <span className="text-xs text-stone-400">{readingMins} min read</span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-10"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {post.title}
        </h1>

        {/* Featured image */}
        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full rounded-xl mb-8"
            style={{ aspectRatio: "16/9", objectFit: "cover" }}
          />
        )}

        {/* Content — rendered HTML from WordPress */}
        <div
          className="wp-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* End-of-post CTA */}
        <div
          className="mt-14 rounded-2xl px-6 py-6 no-grid"
          style={{ backgroundColor: "#EDE8DF" }}
        >
          <p className="text-sm font-semibold text-stone-900 mb-1">
            Check your manuscript with RIC&thinsp;→
          </p>
          <p className="text-xs text-stone-500 leading-relaxed mb-4">
            AI detection, citation integrity, plagiarism scan, and peer review simulation — free tier available.
          </p>
          <a
            href="https://check.aiforacademic.world"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80 no-grid"
            style={{ backgroundColor: "#1a1a18", color: "#f5f2ed" }}
          >
            Try RIC free&thinsp;↗
          </a>
        </div>

        {/* Back link */}
        <div
          className="mt-8 pt-8 border-t"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <Link
            href="/blog"
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            ← All posts
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
