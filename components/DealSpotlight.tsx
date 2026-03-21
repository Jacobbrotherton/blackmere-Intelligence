// Server component — no "use client" needed.
// Receives articles from the server page, picks the 4 best spotlight deals,
// and uses ArticleLink (client) to open the AI briefing modal on click.

import {
  Article,
  getSector,
  extractDealValue,
  formatDealValue,
  timeAgo,
} from "@/lib/news";
import ArticleLink from "@/components/ArticleLink";
import SpotlightImage from "@/components/SpotlightImage";

// ── Article selection ─────────────────────────────────────────────────────────
function selectSpotlightFour(articles: Article[]): Article[] {
  const usedUrls = new Set<string>();
  const unique: Article[] = [];
  const sorted = [...articles].sort((a, b) =>
    (b.description ? 1 : 0) - (a.description ? 1 : 0)
  );
  for (const article of sorted) {
    if (!usedUrls.has(article.url)) {
      usedUrls.add(article.url);
      unique.push(article);
    }
    if (unique.length === 4) break;
  }
  return unique;
}

// ── Card components ────────────────────────────────────────────────────────────
function PrimaryCard({ article }: { article: Article }) {
  const sector = getSector(article.title, article.description);
  const rawValue = extractDealValue(`${article.title} ${article.description ?? ""}`);
  const dealValueStr = rawValue !== null ? formatDealValue(rawValue) : null;

  return (
    <ArticleLink
      article={article}
      className="col-span-12 md:col-span-7 block cursor-pointer group"
    >
      <div className="overflow-hidden h-56 mb-4 w-full">
        <SpotlightImage
          src={article.urlToImage ?? null}
          alt={article.title}
          sector={sector}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-ft-red text-xs font-bold tracking-widest uppercase">
          {sector}
        </span>
        {dealValueStr && (
          <span className="bg-ft-teal text-white text-xs px-2 py-0.5 rounded-sm font-semibold">
            {dealValueStr}
          </span>
        )}
      </div>

      <h2 className="font-display text-2xl md:text-[1.75rem] font-bold leading-snug text-ft-black group-hover:text-ft-teal transition-colors mb-2">
        {article.title}
      </h2>

      {article.description && (
        <p className="text-sm text-ft-muted leading-relaxed line-clamp-3 mb-3">
          {article.description}
        </p>
      )}

      <span className="text-xs font-semibold text-ft-teal group-hover:underline">
        Read analysis →
      </span>
    </ArticleLink>
  );
}

function SecondaryCard({ article }: { article: Article }) {
  const sector = getSector(article.title, article.description);

  return (
    <ArticleLink
      article={article}
      className="col-span-12 md:col-span-5 block cursor-pointer group md:border-l md:border-ft-border md:pl-6"
    >
      <div className="overflow-hidden h-40 mb-4 w-full">
        <SpotlightImage
          src={article.urlToImage ?? null}
          alt={article.title}
          sector={sector}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <span
        className="block font-display text-4xl leading-none text-ft-teal mb-1 select-none"
        aria-hidden
      >
        &ldquo;
      </span>

      <h3 className="font-display text-lg font-semibold leading-snug text-ft-black group-hover:text-ft-teal transition-colors mb-2">
        {article.title}
      </h3>

      {article.description && (
        <p className="text-xs text-ft-muted leading-relaxed line-clamp-3 mb-2">
          {article.description}
        </p>
      )}

      <p className="text-xs text-ft-muted">
        — {article.source.name} · {timeAgo(article.publishedAt)}
      </p>
    </ArticleLink>
  );
}

// ── Spotlight section ─────────────────────────────────────────────────────────
export default function DealSpotlight({ articles }: { articles: Article[] }) {
  const picks = selectSpotlightFour(articles);
  if (picks.length < 1) return null;

  const [p1, p2, p3, p4] = picks;

  return (
    <div className="border-t border-ft-border pt-6 pb-6 border-b border-ft-border">
      {/* Section label */}
      <p className="text-center text-xs font-bold tracking-[0.3em] text-ft-muted uppercase mb-6">
        Spotlight
      </p>

      {/* Row 1 */}
      <div className="grid grid-cols-12 gap-6 items-start mb-8">
        <PrimaryCard article={p1} />
        <SecondaryCard article={p2} />
      </div>

      {/* Row 2 */}
      {p3 && p4 && (
        <div className="grid grid-cols-12 gap-6 items-start border-t border-ft-border pt-6">
          <PrimaryCard article={p3} />
          <SecondaryCard article={p4} />
        </div>
      )}
    </div>
  );
}
