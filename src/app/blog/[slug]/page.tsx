import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://aiforacademic.world/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://aiforacademic.world/blog/${slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <article className="pt-10 pb-16">
        <div className="max-w-2xl mx-auto px-6 md:px-8">
          <div className="mb-2">
            <Link href="/blog" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              ← Blog
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-3 mt-6">
            {post.category && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {post.category}
              </span>
            )}
            {post.date && (
              <span className="text-[11px] text-stone-300">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <h1 className="font-serif font-bold text-stone-900 leading-tight mb-8" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
            {post.title}
          </h1>
          <div
            className="prose prose-stone prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
      <Footer />
    </>
  );
}
