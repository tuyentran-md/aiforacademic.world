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

  const categories = ["Foundation", "Practice", "Tools"];

  const groupedPosts = categories.map(category => ({
    name: category,
    posts: posts.filter(post => post.category?.toLowerCase() === category.toLowerCase())
  }));
  
  const otherPosts = posts.filter(post => !categories.some(c => c.toLowerCase() === post.category?.toLowerCase()));
  
  if (otherPosts.length > 0) {
    groupedPosts.push({ name: "Other", posts: otherPosts });
  }

  return (
    <>
      <section className="pt-12 pb-16 min-h-screen bg-stone-50">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500 mb-4">Blog</p>
          <h1
            className="font-serif font-bold text-stone-900 leading-tight mb-12"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Writing
          </h1>

          {posts.length === 0 ? (
            <p className="text-stone-500 text-sm italic">No posts yet. Check back soon.</p>
          ) : (
            <div className="space-y-16">
              {groupedPosts.filter(group => group.posts.length > 0).map(group => (
                <div key={group.name}>
                  <h2 className="text-xl font-serif font-semibold text-stone-800 border-b border-stone-200 pb-2 mb-6">
                    {group.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.posts.map(post => (
                      <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                        <article className="flex flex-col h-full p-5 bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-300">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-sm">
                              {post.category || "General"}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {post.date ? new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 mt-auto">
                              {post.excerpt}
                            </p>
                          )}
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
