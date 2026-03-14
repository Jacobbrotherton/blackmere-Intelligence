"use client";

import { useEffect } from "react";
import { Article } from "@/lib/news";

/**
 * Silently pre-warms the /api/briefing cache for the top N articles
 * so the modal loads instantly when a user clicks a headline.
 * Repeats every 5 minutes to keep the cache fresh alongside the news feed.
 */
export default function BriefingPrefetcher({
  articles,
  count = 5,
}: {
  articles: Article[];
  count?: number;
}) {
  useEffect(() => {
    const prefetch = () => {
      articles.slice(0, count).forEach((a) => {
        const params = new URLSearchParams({ headline: a.title, url: a.url });
        // Fire-and-forget — we don't need the result here
        fetch(`/api/briefing?${params}`).catch(() => {});
      });
    };

    prefetch();
    const id = setInterval(prefetch, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [articles, count]);

  return null;
}
