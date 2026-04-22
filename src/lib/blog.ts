import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  content: string;
}

export function getAllPosts(): Omit<BlogPost, "content">[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
      const { data } = matter(raw);
      return {
        slug: data.slug || filename.replace(/\.md$/, ""),
        title: data.title || "",
        date: data.date || "",
        excerpt: data.excerpt || "",
        category: data.category || "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safeSlug) return null;
  const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);
  return {
    slug: safeSlug,
    title: data.title || "",
    date: data.date || "",
    excerpt: data.excerpt || "",
    category: data.category || "",
    content: processed.toString(),
  };
}
