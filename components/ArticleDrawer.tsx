"use client";

import { useEffect, useState } from "react";
import {
  Article,
  getSector,
  timeAgo,
  extractDealValue,
  formatDealValue,
} from "@/lib/news";
import { briefings } from "@/lib/briefings";

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

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ArticleDrawer() {
  const [article, setArticle] = useState<Article | null>(null);

  // Listen for article open events
  useEffect(() => {
    const handler = (e: Event) => {
      setArticle((e as CustomEvent<Article>).detail);
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

  const briefingText = briefings[article.url] ?? null;
  const sections = briefingText ? parseSections(briefingText) : [];

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
            <span className="text-xs font-bold tracking-widest text-white uppercase">
              Deal Briefing
            </span>
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

            {/* ── Briefing body ─────────────────────────────────────────── */}
            <div className="mt-6">
              {sections.length > 0 ? (
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
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <p className="text-sm text-ft-muted">
                    Full briefing available for featured articles only — read the full story for details.
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
