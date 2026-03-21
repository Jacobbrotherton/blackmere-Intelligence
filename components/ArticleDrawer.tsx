"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Article,
  getSector,
  timeAgo,
  extractDealValue,
  formatDealValue,
} from "@/lib/news";
import type { BriefingResult, RelatedArticle } from "@/app/api/briefing/route";
import { ArticleSummariseButton } from "@/components/ui/article-summarise-button";

// ── Section parsing ────────────────────────────────────────────────────────────
const SECTION_NAMES = [
  "DEAL OVERVIEW",
  "STRATEGIC RATIONALE",
  "MARKET CONTEXT",
  "REGULATORY & TIMELINE OUTLOOK",
  "ANALYST PERSPECTIVE",
] as const;

function parseSections(text: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  for (let i = 0; i < SECTION_NAMES.length; i++) {
    const name = SECTION_NAMES[i];
    const next = SECTION_NAMES[i + 1] ?? null;
    const start = text.indexOf(name);
    if (start === -1) continue;
    const contentStart = start + name.length;
    const end = next ? text.indexOf(next) : text.length;
    const body = text
      .slice(contentStart, end !== -1 ? end : undefined)
      .replace(/^[:\n\r\s*_#]+/, "")
      .trim();
    if (body) sections.push({ heading: name, body });
  }
  if (sections.length === 0) {
    return [{ heading: "ANALYSIS", body: text.trim() }];
  }
  return sections;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-8 h-8 border-4 border-ft-border border-t-ft-teal rounded-full animate-spin" />
      <p className="text-sm text-ft-muted font-semibold tracking-wide">
        Generating AI briefing…
      </p>
    </div>
  );
}

// ── Source card ────────────────────────────────────────────────────────────────
function SourceCard({
  source,
  index,
}: {
  source: RelatedArticle;
  index: number;
}) {
  const published = new Date(source.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-ft-border bg-white p-3 rounded-sm hover:border-ft-teal transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-ft-muted w-5 shrink-0">
          [{index + 1}]
        </span>
        <span className="text-xs font-semibold text-ft-teal truncate">
          {source.source}
        </span>
        <span className="text-xs text-ft-muted ml-auto shrink-0">{published}</span>
      </div>
      <p className="text-xs leading-snug text-ft-black group-hover:text-ft-teal line-clamp-2">
        {source.title}
      </p>
    </a>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ArticleDrawer() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Listen for article open events
  useEffect(() => {
    const handler = (e: Event) => {
      const a = (e as CustomEvent<Article>).detail;
      setArticle(a);
      setResult(null);
      setFetchError(null);
    };
    window.addEventListener("ft:open-article", handler);
    return () => window.removeEventListener("ft:open-article", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!article) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArticle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [article]);

  const fetchBriefing = useCallback(async (a: Article) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ headline: a.title, url: a.url });
      const res = await fetch(`/api/briefing?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as BriefingResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFetchError(msg.includes("429") ? "RATE_LIMIT" : "UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (article) fetchBriefing(article);
  }, [article, fetchBriefing]);

  if (!article) return null;

  const sector = getSector(article.title, article.description);
  const rawValue = extractDealValue(
    `${article.title} ${article.description ?? ""}`
  );
  const dealValue = rawValue !== null ? formatDealValue(rawValue) : null;
  const published = new Date(article.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sections = result ? parseSections(result.briefing) : [];
  const generatedAt = result
    ? new Date(result.generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      {/* Dark backdrop — click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={() => setArticle(null)}
      />

      {/* Scrollable overlay container */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={() => setArticle(null)}
      >
        {/* Modal panel — stop click propagation so inner clicks don't close */}
        <div
          className="bg-ft-cream w-full max-w-3xl rounded-sm border border-ft-border shadow-2xl mb-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header bar ─────────────────────────────────────────────── */}
          <div className="bg-ft-black px-6 py-4 flex items-center justify-between rounded-t-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest text-white uppercase">
                AI Deal Briefing
              </span>
              {result && !result.cached && (
                <span className="bg-ft-teal text-white text-xs px-2 py-0.5 rounded-sm">
                  Fresh
                </span>
              )}
              {result?.cached && (
                <span className="text-xs text-gray-400">Cached</span>
              )}
            </div>
            <button
              onClick={() => setArticle(null)}
              className="text-gray-400 hover:text-white text-xl leading-none font-bold transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-6">
            {/* ── Sector / value badges ─────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-ft-red text-xs font-bold tracking-widest uppercase">
                {sector}
              </span>
              {dealValue && (
                <span className="bg-ft-teal text-white text-xs px-2 py-0.5 rounded-sm font-semibold">
                  {dealValue}
                </span>
              )}
            </div>

            {/* ── Headline ─────────────────────────────────────────────── */}
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-snug text-ft-black mb-4">
              {article.title}
            </h2>

            {/* ── AI Article Summariser ────────────────────────────────── */}
            <ArticleSummariseButton articleTitle={article.title} articleUrl={article.url} />

            {/* ── Meta row ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 text-xs pb-5 border-b border-ft-border mt-3">
              <span className="bg-ft-teal text-white px-2 py-0.5 rounded-sm font-semibold">
                {article.source.name}
              </span>
              <span className="text-ft-muted">{published}</span>
              <span className="text-ft-muted">{timeAgo(article.publishedAt)}</span>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-ft-teal hover:underline font-semibold"
              >
                Read original →
              </a>
            </div>

            {/* ── AI Briefing body ─────────────────────────────────────── */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-ft-black px-2.5 py-1 rounded-full">
                  ⚡ Groq AI
                </span>
                <span className="text-ft-muted text-xs">AI-generated briefing</span>
              </div>
              {loading && <Spinner />}

              {!loading && fetchError && (
                <div className="py-10 text-center space-y-4">
                  <p className="text-sm text-ft-muted">
                    {fetchError === "RATE_LIMIT"
                      ? "Today's AI briefing capacity has been reached. We apologise for the inconvenience — full briefings will resume tomorrow."
                      : "Briefing temporarily unavailable — please read the full story."}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-ft-teal text-white text-sm font-semibold px-5 py-2.5 rounded-sm hover:opacity-90"
                  >
                    Read full story →
                  </a>
                </div>
              )}

              {!loading && result && sections.length > 0 && (
                <div className="space-y-6">
                  {sections.map(({ heading, body }) => (
                    <div key={heading}>
                      <h3 className="text-xs font-bold tracking-widest text-ft-teal uppercase mb-2">
                        {heading}
                      </h3>
                      <p className="text-sm text-ft-black leading-relaxed">
                        {body}
                      </p>
                    </div>
                  ))}

                  {/* Timestamp + regenerate */}
                  <div className="flex items-center gap-4 pt-3 border-t border-ft-border">
                    {generatedAt && (
                      <p className="text-xs text-ft-muted">
                        Generated at {generatedAt}
                        {result.cached ? " · cached" : ""}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setResult(null);
                        fetchBriefing(article);
                      }}
                      className="text-xs text-ft-teal hover:underline font-semibold ml-auto"
                    >
                      ↻ Regenerate briefing
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sources ──────────────────────────────────────────────── */}
            {result && result.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-ft-black">
                <h3 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-4">
                  Sources · {result.sources.length} related articles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.sources.map((s, i) => (
                    <SourceCard key={s.url} source={s} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
