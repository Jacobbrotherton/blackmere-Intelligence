import Link from "next/link";
import { fetchMaNews, getSector, timeAgo, SECTOR_MAP } from "@/lib/news";

interface AVTickerSentiment {
  ticker: string;
  relevance_score: string;
  ticker_sentiment_score: string;
  ticker_sentiment_label: string;
}

interface AVArticle {
  title: string;
  url: string;
  time_published: string;
  source: string;
  summary: string;
  banner_image?: string;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: AVTickerSentiment[];
}

interface StockQuote {
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
}

async function fetchAVSentiment(): Promise<AVArticle[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=mergers_and_acquisitions&sort=LATEST&limit=20&apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.Information) return [];
    return data.feed ?? [];
  } catch {
    return [];
  }
}

async function fetchStockQuote(
  symbol: string
): Promise<StockQuote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.Information) return null;
    const q = data["Global Quote"];
    if (!q?.["05. price"]) return null;
    const change = parseFloat(q["09. change"]);
    return {
      price: parseFloat(q["05. price"]).toFixed(2),
      change: change.toFixed(2),
      changePercent: parseFloat(
        q["10. change percent"].replace("%", "")
      ).toFixed(2),
      up: change >= 0,
    };
  } catch {
    return null;
  }
}

function sentimentColor(label: string): string {
  if (label.toLowerCase().includes("bullish")) return "text-green-700";
  if (label.toLowerCase().includes("bearish")) return "text-red-700";
  return "text-amber-600";
}

export default async function DealPage({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const articleUrl = searchParams.url
    ? decodeURIComponent(searchParams.url)
    : null;

  if (!articleUrl) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-10 font-sans text-ft-black">
        <p className="text-ft-muted">No deal specified.</p>
        <Link href="/" className="text-ft-teal hover:underline text-sm">
          ← Back to M&amp;A Deal Tracker
        </Link>
      </div>
    );
  }

  // Fetch all M&A news (cached 5 min) and find this article by URL
  const [allArticles, avFeed] = await Promise.all([
    fetchMaNews(),
    fetchAVSentiment(),
  ]);

  const article = allArticles.find((a) => a.url === articleUrl) ?? null;

  // Try to match in Alpha Vantage feed by URL, then by title similarity
  const avMatch =
    avFeed.find((a) => a.url === articleUrl) ??
    (article
      ? avFeed.find((a) =>
          a.title.toLowerCase().includes(
            article.title.split(" ").slice(0, 4).join(" ").toLowerCase()
          )
        )
      : null) ??
    null;

  const sector = article
    ? getSector(article.title, article.description)
    : "M&A";

  // Collect high-relevance tickers from AV match
  const relevantTickers = (avMatch?.ticker_sentiment ?? [])
    .filter((t) => parseFloat(t.relevance_score) > 0.25)
    .slice(0, 6);

  // Fetch stock quotes for those tickers in parallel
  const quoteResults = await Promise.allSettled(
    relevantTickers.map(async (t) => ({
      ticker: t.ticker,
      sentimentLabel: t.ticker_sentiment_label,
      sentimentScore: parseFloat(t.ticker_sentiment_score),
      quote: await fetchStockQuote(t.ticker),
    }))
  );
  const stocks = quoteResults
    .filter((r): r is PromiseFulfilledResult<{
      ticker: string;
      sentimentLabel: string;
      sentimentScore: number;
      quote: StockQuote | null;
    }> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((s) => s.quote !== null);

  // Related articles — same sector, different URL, most recent first
  const related = allArticles
    .filter(
      (a) =>
        a.url !== articleUrl &&
        getSector(a.title, a.description) === sector
    )
    .slice(0, 5);

  const displayTitle = article?.title ?? decodeURIComponent(searchParams.url ?? "");

  return (
    <div className="font-sans text-ft-black bg-ft-cream min-h-screen">
      {/* Mini header */}
      <header className="bg-ft-black text-white py-3 px-6 flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-white tracking-wide"
        >
          ← M&amp;A DEAL TRACKER
        </Link>
        <span className="text-gray-600">|</span>
        <span className="text-xs text-gray-400 tracking-widest uppercase">
          Deal Analysis
        </span>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* ── Main content ── */}
          <article className="col-span-12 md:col-span-8">
            {/* Sector + breaking tag */}
            <div className="mb-3">
              <span className="text-ft-red text-xs font-bold tracking-widest uppercase">
                {sector} · Deal Analysis
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl font-bold leading-tight mb-4">
              {displayTitle}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-ft-muted mb-6 pb-4 border-b border-ft-border">
              {article && (
                <>
                  <strong className="text-ft-black">{article.source.name}</strong>
                  <span>·</span>
                  <span>
                    {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </>
              )}
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto bg-ft-teal text-white text-xs px-3 py-1.5 rounded-sm hover:opacity-90"
              >
                Read original article →
              </a>
            </div>

            {/* Hero image */}
            {article?.urlToImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.urlToImage}
                alt={displayTitle}
                className="w-full object-cover mb-6 max-h-80 rounded-sm"
              />
            )}

            {/* Summary / description */}
            <div className="border-l-4 border-ft-teal pl-4 mb-8">
              <p className="text-base leading-relaxed">
                {avMatch?.summary ??
                  article?.description ??
                  "No summary available. Click the link above to read the full article."}
              </p>
            </div>

            {/* ── Sentiment analysis (Alpha Vantage) ── */}
            {avMatch && (
              <div className="bg-white border border-ft-border p-5 rounded-sm mb-8">
                <h2 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-4">
                  Market Sentiment · Alpha Vantage Analysis
                </h2>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-xs text-ft-muted mb-1">
                      Overall Sentiment
                    </div>
                    <div
                      className={`font-display text-2xl font-bold ${sentimentColor(
                        avMatch.overall_sentiment_label
                      )}`}
                    >
                      {avMatch.overall_sentiment_label}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ft-muted mb-1">Score</div>
                    <div className="font-display text-2xl font-bold">
                      {avMatch.overall_sentiment_score.toFixed(3)}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-ft-muted max-w-xs self-end">
                    Scale: −1.0 (very bearish) → +1.0 (very bullish). Measures
                    how financial media perceives this deal.
                  </div>
                </div>

                {/* Sentiment bar */}
                <div className="mt-4 h-2 bg-ft-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      avMatch.overall_sentiment_score >= 0
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                    style={{
                      width: `${Math.abs(avMatch.overall_sentiment_score) * 100}%`,
                      marginLeft:
                        avMatch.overall_sentiment_score >= 0 ? "50%" : undefined,
                      marginRight:
                        avMatch.overall_sentiment_score < 0
                          ? `${50 - Math.abs(avMatch.overall_sentiment_score) * 50}%`
                          : undefined,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-ft-muted mt-1">
                  <span>Bearish −1.0</span>
                  <span>Neutral 0</span>
                  <span>+1.0 Bullish</span>
                </div>
              </div>
            )}

            {/* ── Companies mentioned ── */}
            {stocks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-4">
                  Companies Mentioned · Live Prices
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stocks.map((s) => (
                    <div
                      key={s.ticker}
                      className="bg-white border border-ft-border p-3 rounded-sm"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-display font-bold text-sm">
                          {s.ticker}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            s.quote!.up ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {s.quote!.up ? "▲" : "▼"}
                        </span>
                      </div>
                      <div className="font-display text-xl font-bold mt-1">
                        ${s.quote!.price}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-0.5 ${
                          s.quote!.up ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {s.quote!.up ? "+" : ""}
                        {s.quote!.change} ({s.quote!.up ? "+" : ""}
                        {s.quote!.changePercent}%)
                      </div>
                      <div
                        className={`text-xs mt-2 ${sentimentColor(
                          s.sentimentLabel
                        )}`}
                      >
                        {s.sentimentLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Key deal facts (derived from article) ── */}
            <div className="bg-ft-mint border border-ft-border p-5 rounded-sm mb-8">
              <h2 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-3">
                Deal Context
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-ft-muted">Sector</div>
                  <div className="font-semibold mt-0.5">{sector}</div>
                </div>
                {article && (
                  <>
                    <div>
                      <div className="text-xs text-ft-muted">Source</div>
                      <div className="font-semibold mt-0.5">
                        {article.source.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-ft-muted">Published</div>
                      <div className="font-semibold mt-0.5">
                        {new Date(article.publishedAt).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </div>
                    </div>
                  </>
                )}
                {avMatch && (
                  <div>
                    <div className="text-xs text-ft-muted">
                      Tickers Identified
                    </div>
                    <div className="font-semibold mt-0.5">
                      {relevantTickers.length > 0
                        ? relevantTickers.map((t) => t.ticker).join(", ")
                        : "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-ft-black text-white px-6 py-3 rounded-sm hover:bg-ft-teal transition-colors font-semibold text-sm"
            >
              Read Full Article at {article?.source.name ?? "Source"} →
            </a>
          </article>

          {/* ── Sidebar ── */}
          <aside className="col-span-12 md:col-span-4">
            {/* Sector nav */}
            <div className="mb-6">
              <h3 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-3">
                Browse by Sector
              </h3>
              <div className="space-y-1">
                {SECTOR_MAP.map((s) => (
                  <Link
                    key={s.id}
                    href={`/#${s.id}`}
                    className="block text-sm text-ft-muted hover:text-ft-teal hover:bg-ft-grey px-2 py-1.5 rounded-sm transition-colors"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>

            <hr className="ft-divider border-t my-4" />

            {/* Related articles */}
            {related.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-widest text-ft-muted uppercase mb-4">
                  More {sector} Deals
                </h3>
                <div className="space-y-4">
                  {related.map((a, i) => (
                    <div key={i}>
                      <Link
                        href={`/deal?url=${encodeURIComponent(a.url)}`}
                        className="block group"
                      >
                        <p className="text-xs text-ft-muted mb-0.5">
                          {a.source.name} · {timeAgo(a.publishedAt)}
                        </p>
                        <p className="font-display font-semibold text-sm leading-snug group-hover:text-ft-teal">
                          {a.title}
                        </p>
                      </Link>
                      {i < related.length - 1 && (
                        <hr className="ft-divider border-t mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="bg-ft-black text-gray-400 text-xs mt-10 px-6 py-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <p className="font-display text-white text-base">M&amp;A Deal Tracker</p>
          <Link href="/" className="text-gray-400 hover:text-white">
            ← All Deals
          </Link>
        </div>
      </footer>
    </div>
  );
}
