import { Article, SECTOR_MAP, timeAgo } from "@/lib/news";
import ArticleLink from "@/components/ArticleLink";

function matchesSector(article: Article, keywords: readonly string[]): boolean {
  const text = `${article.title} ${article.description ?? ""}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <ArticleLink
      article={article}
      className="block bg-white border border-ft-border p-4 rounded-sm hover:border-ft-teal transition-colors group cursor-pointer"
    >
      <p className="text-xs text-ft-muted mb-1.5">
        {article.source.name} · {timeAgo(article.publishedAt)}
      </p>
      <p className="font-display font-semibold text-sm leading-snug group-hover:text-ft-teal">
        {article.title}
      </p>
      {article.description && (
        <p className="text-xs text-ft-muted mt-2 line-clamp-2 leading-relaxed">
          {article.description}
        </p>
      )}
      <p className="text-xs text-ft-teal mt-2 group-hover:underline">
        Read full analysis →
      </p>
    </ArticleLink>
  );
}

export default function SectorSections({ articles }: { articles: Article[] }) {
  return (
    <div className="mt-12 space-y-12">
      {SECTOR_MAP.map((sector) => {
        const sectorArticles = articles
          .filter((a) => matchesSector(a, sector.keywords))
          .slice(0, 4);

        if (sectorArticles.length === 0) return null;

        return (
          <section key={sector.id} id={sector.id}>
            <div className="border-t-2 border-ft-black pt-6 mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-bold">{sector.label}</h2>
              <span className="text-xs text-ft-muted tracking-widest uppercase">
                {sectorArticles.length} deal{sectorArticles.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sectorArticles.map((article, i) => (
                <ArticleCard key={i} article={article} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
