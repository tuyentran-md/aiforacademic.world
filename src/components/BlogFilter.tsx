"use client";

import { useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export default function BlogFilter({ posts }: { posts: Omit<BlogPost, "content">[] }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Foundations", "Practice", "AI Tools"];
  
  const displayed = filter === "All" 
    ? posts 
    : posts.filter(p => p.category?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === c ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-600 hover:bg-stone-300"}`}
          >
            {c}
          </button>
        ))}
      </div>
      
      {displayed.length === 0 ? (
        <p className="text-stone-500 text-sm italic">No posts in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
              <article className="flex flex-col h-full p-6 bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-1 rounded-sm">
                    {post.category || "General"}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {post.date ? new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-stone-900 group-hover:text-stone-600 transition-colors mb-3 leading-snug">
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
      )}
    </div>
  );
}