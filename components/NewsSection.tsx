"use client";

import { useState, useEffect, useCallback } from "react";
import type { Article } from "@/lib/news";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function openArticle(article: Article) {
  window.dispatchEvent(
    new CustomEvent("ft:open-article", { detail: article })
  );
}

export default function NewsSection({ excludeUrls }: { excludeUrls?: string[] }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      const fetched: Article[] = data.articles ?? [];
      setArticles(fetched);
      setLastUpdated(new Date());
      setError(null);
      setCountdown(REFRESH_INTERVAL / 1000);
      // Pre-warm briefing cache for the top 5 sidebar articles
      fetched.slice(0, 5).forEach((a) => {
        const params = new URLSearchParams({ headline: a.title, url: a.url });
        fetch(`/api/briefing?${params}`).catch(() => {});
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const refreshTimer = setInterval(fetchNews, REFRESH_INTERVAL);
    return () => clearInterval(refreshTimer);
  }, [fetchNews]);

  // Live countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const nextRefreshMins = Math.floor(countdown / 60);
  const nextRefreshSecs = countdown % 60;

  if (loading) {
    return (
      <div>
        <h4 className="text-xs font-bold tracking-widest text-ft-muted mb-3 uppercase">
          Live M&amp;A News
        </h4>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-2.5 bg-ft-border rounded w-20" />
              <div className="h-3.5 bg-ft-border rounded w-full" />
              <div className="h-3.5 bg-ft-border rounded w-4/5" />
              <div className="h-2.5 bg-ft-border rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h4 className="text-xs font-bold tracking-widest text-ft-muted mb-3 uppercase">
          Live M&amp;A News
        </h4>
        <p className="text-xs text-ft-red mb-2">{error}</p>
        <button
          onClick={fetchNews}
          className="text-xs text-ft-teal hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold tracking-widest text-ft-muted uppercase">
          Live M&amp;A News
        </h4>
        <span className="text-xs text-ft-muted tabular-nums">
          {nextRefreshMins}:{String(nextRefreshSecs).padStart(2, "0")}
        </span>
      </div>

      {lastUpdated && (
        <p className="text-xs text-ft-muted mb-3">
          Updated{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      <div className="space-y-3">
        {articles.filter((a) => !excludeUrls?.includes(a.url)).slice(0, 7).map((article, i) => (
          <div key={`${article.url}-${i}`}>
            <div className="deal-card py-2 px-1 rounded">
              <span className="text-ft-muted text-xs tracking-wide">
                {article.source.name}
              </span>
              <button
                onClick={() => openArticle(article)}
                className="block text-left w-full"
              >
                <p className="text-sm font-semibold leading-tight mt-0.5 hover:text-ft-teal cursor-pointer line-clamp-3">
                  {article.title}
                </p>
              </button>
              <p className="text-xs text-ft-muted mt-0.5">
                {timeAgo(article.publishedAt)}
              </p>
            </div>
            {i < 6 && <hr className="ft-divider border-t mt-3" />}
          </div>
        ))}
      </div>

      <button
        onClick={fetchNews}
        className="mt-4 text-xs text-ft-teal hover:underline tracking-wide"
      >
        ↻ Refresh now
      </button>
    </div>
  );
}
