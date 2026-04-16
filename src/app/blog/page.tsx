import type { Metadata } from "next";
import Footer from "@/components/Footer";
import BlogFilter from "@/components/BlogFilter";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on research methodology, AI in medicine, and academic publishing — by Tuyến Trần, MD.",
  alternates: { canonical: "https://aiforacademic.world/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="pt-12 pb-16 min-h-screen bg-stone-50">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500 mb-4">Read</p>
          <h1
            className="font-serif font-bold text-stone-900 leading-tight mb-12"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Blog
          </h1>

          {posts.length === 0 ? (
            <p className="text-stone-500 text-sm italic">No posts yet. Check back soon.</p>
          ) : (
            <BlogFilter posts={posts} />
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}