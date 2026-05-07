import { notFound } from "next/navigation";
import Link from "next/link";
import {
  SECTOR_MAP,
  Article,
  timeAgo,
  extractDealValue,
  formatDealValue,
} from "@/lib/news";
import { homepageArticles } from "@/lib/homepage-articles";
import ArticleLink from "@/components/ArticleLink";
import ArticleDrawer from "@/components/ArticleDrawer";

function ArticleCard({ article }: { article: Article }) {
  const rawValue = extractDealValue(`${article.title} ${article.description ?? ""}`);
  const dealValue = rawValue !== null ? formatDealValue(rawValue) : null;
  return (
    <ArticleLink
      article={article}
      className="block bg-white border border-ft-border p-4 rounded-sm hover:border-ft-teal transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        {dealValue && (
          <span className="bg-ft-teal text-white text-xs px-1.5 py-0.5 rounded-sm font-semibold">
            {dealValue}
          </span>
        )}
        <span className="text-xs text-ft-muted ml-auto">{timeAgo(article.publishedAt)}</span>
      </div>
      <p className="font-display font-semibold text-sm leading-snug group-hover:text-ft-teal mb-2">
        {article.title}
      </p>
      {article.description && (
        <p className="text-xs text-ft-muted line-clamp-2 leading-relaxed mb-2">
          {article.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-semibold text-ft-teal">{article.source.name}</span>
        <span className="text-xs text-ft-teal group-hover:underline">Deal Briefing →</span>
      </div>
    </ArticleLink>
  );
}

export default function SectorPage({ params }: { params: { id: string } }) {
  const sector = SECTOR_MAP.find((s) => s.id === params.id);
  if (!sector) notFound();

  // Filter homepage articles by sector keywords; show all if none match
  const sectorArticles = homepageArticles.filter((a) => {
    const text = `${a.title} ${a.description ?? ""} ${a.sector ?? ""}`.toLowerCase();
    return sector.keywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  const articles: Article[] = sectorArticles.length > 0 ? sectorArticles : homepageArticles;

  return (
    <>
      <header className="bg-ft-cream border-b border-ft-border">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-ft-teal hover:underline font-semibold tracking-wide mb-3"
          >
            ← Back to M&amp;A Deal Tracker
          </Link>
          <div className="flex items-baseline justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-ft-black leading-tight">
                {sector.label}
              </h1>
              <p className="text-xs text-ft-muted mt-1 tracking-widest">
                {articles.length} DEAL{articles.length !== 1 ? "S" : ""} · CLICK ANY CARD FOR DEAL BRIEFING
              </p>
            </div>
            <nav className="hidden md:flex flex-wrap gap-2 justify-end">
              {SECTOR_MAP.filter((s) => s.id !== params.id).map((s) => (
                <Link
                  key={s.id}
                  href={`/sectors/${s.id}`}
                  className="text-xs px-2 py-1 border border-ft-border rounded-sm text-ft-muted hover:border-ft-teal hover:text-ft-teal transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} />
          ))}
        </div>
      </main>

      <ArticleDrawer />
    </>
  );
}
