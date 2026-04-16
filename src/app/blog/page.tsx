import type { Metadata } from "next";
import Footer from "@/components/Footer";
import BlogHub from "@/components/BlogHub";
import { getAllBlogPosts } from "@/lib/wp";

// Revalidate every hour — lets the page cache while WordPress posts stay fresh.
// Remove this line and add `dynamic = "force-dynamic"` if you want fully live rendering.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on AI in clinical research, research methodology, and publishing strategy — by Tuyến Trần, MD.",
  alternates: {
    canonical: "https://aiforacademic.world/blog",
  },
  openGraph: {
    title: "Blog — AI for Academic",
    description:
      "Writing on AI in clinical research, research methodology, and publishing strategy.",
    url: "https://aiforacademic.world/blog",
  },
};

// ── Blog illustration ─────────────────────────────────────────────────────────

function BlogIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="30" y="20" width="110" height="140" rx="8" fill="#f0ede8" stroke="#1a1a18" strokeWidth="2.8"/>
      <line x1="44" y1="44" x2="126" y2="44" stroke="#1a1a18" strokeWidth="3" strokeLinecap="round"/>
      <line x1="44" y1="62" x2="126" y2="62" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="44" y1="76" x2="126" y2="76" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="44" y1="90" x2="100" y2="90" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="44" y1="108" x2="126" y2="108" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="44" y1="122" x2="114" y2="122" stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M118 130 L154 80 L164 90 L128 140 Z" fill="#C4634E" stroke="#1a1a18" strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M118 130 L112 148 L130 142 Z" fill="#1a1a18" stroke="#1a1a18" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <>
      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <section className="pt-8 pb-0 md:pt-10">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div
            className="rounded-3xl px-8 py-12 md:px-12 md:py-14 no-grid"
            style={{ backgroundColor: "#C6D2DC" }}
          >
            <div className="grid md:grid-cols-[1fr_200px] gap-10 items-center">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#555555" }}
                >
                  Writing
                </p>
                <h1
                  className="font-serif font-bold text-stone-900 leading-[1.05] mb-4"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                  Blog
                </h1>
                <p className="text-[15px] text-stone-600 leading-relaxed max-w-xl mb-2">
                  Writing on AI in clinical research, methodology, publishing strategy, and what it means to build honest science.
                </p>
                <p className="text-xs text-stone-400 mt-1">{posts.length} posts</p>
              </div>
              <div className="hidden md:block flex-shrink-0 w-[180px] h-[180px] opacity-55">
                <BlogIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG HUB — dynamic tabs + grid ─────────────────── */}
      <BlogHub posts={posts} />

      {posts.length === 0 && (
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-16 text-center">
          <p className="text-stone-400 text-sm">
            Blog posts are loading from WordPress. If this persists, check the WordPress REST API connection.
          </p>
        </div>
      )}

      <Footer />
    </>
  );
}
