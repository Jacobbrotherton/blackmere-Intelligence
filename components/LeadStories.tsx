import { Article, getSector, timeAgo } from "@/lib/news";
import TopWorldMap from "@/components/TopWorldMap";
import ArticleLink from "@/components/ArticleLink";

function SectorTag({ title, description }: { title: string; description: string | null }) {
  return (
    <span className="text-ft-red text-xs font-bold tracking-widest uppercase">
      {getSector(title, description)}
    </span>
  );
}

export default function LeadStories({ articles }: { articles: Article[] }) {
  const [lead, second, third, featured] = articles;

  if (!lead) {
    return (
      <>
        <div className="col-span-12 md:col-span-4 border-r border-ft-border pr-6">
          <p className="text-sm text-ft-muted">No articles available.</p>
        </div>
        <div className="col-span-12 md:col-span-5 border-r border-ft-border pr-6" />
      </>
    );
  }

  return (
    <>
      {/* ── Left column: top 3 stories ── */}
      <div className="col-span-12 md:col-span-4 border-r border-ft-border pr-6">
        {/* Lead story */}
        <div className="mb-4">
          <SectorTag title={lead.title} description={lead.description} />
          <ArticleLink article={lead}>
            <h2 className="font-display text-3xl font-bold leading-tight mt-1 hover:text-ft-teal cursor-pointer">
              {lead.title}
            </h2>
          </ArticleLink>
          {lead.description && (
            <p className="text-sm text-ft-muted mt-2 leading-relaxed line-clamp-3">
              {lead.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="bg-ft-teal text-white px-2 py-0.5 rounded-sm">
              {lead.source.name}
            </span>
            <span className="text-ft-muted">{timeAgo(lead.publishedAt)}</span>
          </div>
        </div>

        {second && (
          <>
            <hr className="ft-divider border-t my-4" />
            <div className="mb-4">
              <SectorTag title={second.title} description={second.description} />
              <ArticleLink article={second}>
                <h3 className="font-display text-xl font-semibold leading-snug mt-1 hover:text-ft-teal cursor-pointer">
                  {second.title}
                </h3>
              </ArticleLink>
              {second.description && (
                <p className="text-xs text-ft-muted mt-1 line-clamp-2">
                  {second.description}
                </p>
              )}
              <p className="text-xs text-ft-muted mt-1">
                {second.source.name} · {timeAgo(second.publishedAt)}
              </p>
            </div>
          </>
        )}

        {third && (
          <>
            <hr className="ft-divider border-t my-4" />
            <div>
              <SectorTag title={third.title} description={third.description} />
              <ArticleLink article={third}>
                <h3 className="font-display text-xl font-semibold leading-snug mt-1 hover:text-ft-teal cursor-pointer">
                  {third.title}
                </h3>
              </ArticleLink>
              <p className="text-xs text-ft-muted mt-1">
                {third.source.name} · {timeAgo(third.publishedAt)}
              </p>
            </div>
          </>
        )}

        {/* Additional brief headlines to fill column */}
        {[articles[5], articles[6], articles[7]].filter(Boolean).map((a, i) => (
          <div key={`extra-${i}`}>
            <hr className="ft-divider border-t my-3" />
            <div>
              <SectorTag title={a.title} description={a.description} />
              <ArticleLink article={a}>
                <h4 className="font-display text-base font-semibold leading-snug mt-1 hover:text-ft-teal cursor-pointer line-clamp-2">
                  {a.title}
                </h4>
              </ArticleLink>
              <p className="text-xs text-ft-muted mt-0.5">
                {a.source.name} · {timeAgo(a.publishedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Centre column: map + featured story ── */}
      <div className="col-span-12 md:col-span-5 border-r border-ft-border pr-6">
        {featured ? (
          <>
            <div className="mb-3">
              <TopWorldMap />
            </div>

            <SectorTag title={featured.title} description={featured.description} />
            <ArticleLink article={featured}>
              <h2 className="font-display text-2xl font-bold leading-tight mt-1 hover:text-ft-teal cursor-pointer">
                {featured.title}
              </h2>
            </ArticleLink>
            {featured.description && (
              <p className="text-sm text-ft-muted mt-2 leading-relaxed line-clamp-4">
                {featured.description}
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white border border-ft-border p-2 rounded-sm">
                <div className="text-ft-muted">Source</div>
                <div className="font-bold text-sm font-display truncate">
                  {featured.source.name}
                </div>
              </div>
              <div className="bg-white border border-ft-border p-2 rounded-sm">
                <div className="text-ft-muted">Sector</div>
                <div className="font-bold text-sm font-display">
                  {getSector(featured.title, featured.description)}
                </div>
              </div>
              <div className="bg-white border border-ft-border p-2 rounded-sm">
                <div className="text-ft-muted">Published</div>
                <div className="font-bold text-sm font-display">
                  {timeAgo(featured.publishedAt)}
                </div>
              </div>
            </div>

            <hr className="ft-divider border-t my-4" />

            {articles[4] && (
              <ArticleLink article={articles[4]}>
                <blockquote className="border-l-4 border-ft-teal pl-3 cursor-pointer group">
                  <p className="font-display italic text-base leading-snug text-ft-black group-hover:text-ft-teal">
                    &ldquo;{articles[4].title}&rdquo;
                  </p>
                  <cite className="text-xs text-ft-muted mt-1 block">
                    — {articles[4].source.name}
                  </cite>
                </blockquote>
              </ArticleLink>
            )}

            {/* Additional articles below map */}
            {articles.slice(8, 14).filter(Boolean).map((a, i) => (
              <div key={`centre-extra-${i}`}>
                <hr className="ft-divider border-t my-3" />
                <SectorTag title={a.title} description={a.description} />
                <ArticleLink article={a}>
                  <h4 className="font-display text-base font-semibold leading-snug mt-1 hover:text-ft-teal cursor-pointer line-clamp-2">
                    {a.title}
                  </h4>
                </ArticleLink>
                <p className="text-xs text-ft-muted mt-0.5">
                  {a.source.name} · {timeAgo(a.publishedAt)}
                </p>
              </div>
            ))}
          </>
        ) : (
          <TopWorldMap />
        )}
      </div>
    </>
  );
}
