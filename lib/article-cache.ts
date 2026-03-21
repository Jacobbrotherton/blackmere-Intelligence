// Shared in-memory article cache accessible by all API routes and server functions
export interface CachedArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
  sector?: string;
  dealValue?: string;
  acquirer?: string;
  target?: string;
  urlToImage?: string | null;
}

let articleCache: CachedArticle[] = [];
let lastCached = 0;

export function getCachedArticles(): CachedArticle[] {
  return articleCache;
}

export function setCachedArticles(articles: CachedArticle[]): void {
  articleCache = articles;
  lastCached = Date.now();
}

export function getCacheAge(): number {
  return lastCached;
}

export function isCacheStale(maxAgeMs = 2 * 60 * 60 * 1000): boolean {
  return Date.now() - lastCached > maxAgeMs;
}
