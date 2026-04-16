import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
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
      <section className="pt-12 pb-16">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Blog</p>
          <h1
            className="font-serif font-bold text-stone-900 leading-tight mb-10"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Writing
          </h1>

          {posts.length === 0 ? (
            <p className="text-stone-400 text-sm">No posts yet.</p>
          ) : (
            <div className="divide-y divide-stone-200">
              {posts.map((post) => (
                <article key={post.slug} className="py-6">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="flex items-center gap-3 mb-1.5">
                      {post.category && (
                        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                          {post.category}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-300">
                        {post.date ? new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-stone-900 group-hover:text-stone-600 transition-colors mb-1.5">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                    )}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
