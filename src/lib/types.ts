/** WordPress REST API post shape (partial) */
export interface WPPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  status: string;
  /** Category IDs */
  categories: number[];
  /** Embedded terms (when ?_embed is used) */
  _embedded?: {
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
  };
}

/** Normalised blog post used in the UI */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  featuredImage?: string;
}
