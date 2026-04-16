"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/types";

const PER_PAGE = 9;

/** Format ISO date → "Mar 2026" */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex flex-col rounded-2xl p-6 group transition-all hover:shadow-md no-grid"
      style={{ backgroundColor: "#E5DFCF" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#D4E8F5", color: "#2E5A80" }}
        >
          {post.category}
        </span>
        <span className="text-xs text-stone-400">{fmtDate(post.date)}</span>
      </div>
      <h3 className="text-[15px] font-semibold text-stone-900 leading-snug mb-2 group-hover:text-stone-700 transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 flex-1">
        {post.excerpt.length > 120
          ? post.excerpt.slice(0, 120) + "…"
          : post.excerpt}
      </p>
      <span className="text-xs text-stone-400 mt-4 group-hover:text-stone-600 transition-colors">
        Read →
      </span>
    </Link>
  );
}

export default function BlogHub({ posts }: { posts: BlogPost[] }) {
  // Build dynamic tabs from categories that exist in the posts
  const tabs = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const p of posts) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        cats.push(p.category);
      }
    }
    return [{ key: "all", label: "All" }, ...cats.map((c) => ({ key: c, label: c }))];
  }, [posts]);

  const [activeTab, setActiveTab] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeTab === "all") return posts;
    return posts.filter((p) => p.category === activeTab);
  }, [posts, activeTab]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    for (const p of posts) {
      c[p.category] = (c[p.category] ?? 0) + 1;
    }
    return c;
  }, [posts]);

  return (
    <div>
      {/* ── Sticky category tabs ─────────────────────────── */}
      <div
        className="sticky top-14 z-20 border-b no-grid"
        style={{
          backgroundColor: "rgba(245,242,236,0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = counts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-xs ${isActive ? "text-white/60" : "text-stone-400"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Post grid ───────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {paginated.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {paginated.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-12">
            No posts in this category yet.
          </p>
        )}

        {/* ── Pagination ──────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-30 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-all"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 text-sm rounded-lg transition-all ${
                  n === page
                    ? "bg-stone-900 text-white"
                    : "text-stone-400 hover:text-stone-800 hover:bg-stone-200/50"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-30 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
