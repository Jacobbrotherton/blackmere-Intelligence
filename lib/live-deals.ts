import Groq from "groq-sdk";
import type { RumouredDeal } from "./rumoured-deals";

// ── In-memory cache (6-hour TTL) ──────────────────────────────────────────────
const cache = new Map<string, { deals: RumouredDeal[]; generatedAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

// ── Specific M&A queries that cut through noise ───────────────────────────────
const QUERIES = [
  '"definitive agreement" OR "takeover bid" OR "acquisition agreement" merger',
  '"in talks to acquire" OR "agreed to buy" OR "buyout offer" billion',
  '"merger agreement" OR "acquisition talks" OR "deal talks" M&A 2025 OR 2026',
];

// ── Strict Groq extraction prompt ─────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a strict M&A data extraction specialist for an institutional investment intelligence platform.

From the provided news articles, extract ONLY deals that meet ALL of these criteria:
1. BOTH the acquirer AND target company are explicitly named by their proper corporate name
2. The article uses concrete deal language: "bid submitted", "offer made", "talks confirmed", "in discussions to acquire", "agreed to buy", "definitive agreement" — NOT vague speculation like "could consider", "might acquire", "analysts suggest", "has been exploring"
3. The article is from a credible financial outlet — Reuters, Bloomberg, Financial Times, CNBC, Wall Street Journal, MarketWatch, Business Insider, Fortune, or equivalent. Ignore tabloids, blogs, and low-credibility sources.
4. The deal is CURRENTLY ACTIVE — not historical, not already completed, not cancelled
5. You are highly confident this is a real, credibly-reported corporate transaction

For each qualifying deal return a JSON object with EXACTLY these fields:
{
  "id": "acquirer-target slug in lowercase with hyphens e.g. microsoft-activision",
  "acquirerName": "Full company name",
  "targetName": "Full company name",
  "acquirerTicker": "NYSE or NASDAQ ticker symbol, or PRIVATE if not listed",
  "targetTicker": "NYSE or NASDAQ ticker symbol, or PRIVATE if not listed",
  "estimatedValue": "$XB format e.g. $5.2B, or Undisclosed",
  "estimatedValueNum": number in billions as a float (use 0 if truly unknown),
  "dealType": one of exactly: "Merger" | "Acquisition" | "Buyout" | "PE Deal" | "Strategic Review",
  "status": one of exactly: "Rumour" | "Talks Confirmed" | "Under Review",
  "summary": "3-4 sentences with factual deal details: who is buying whom, the reported value, why the deal makes strategic sense, and the current status based on the articles",
  "source": "Publication name e.g. Reuters / Bloomberg",
  "dateRumoured": "YYYY-MM format",
  "sector": "Industry sector e.g. Technology / Software"
}

Return {"deals": []} if no articles qualify. Quality over quantity — 3 real deals is better than 8 uncertain ones. DO NOT invent or extrapolate beyond what the articles explicitly state.`;

// ── Fetch M&A articles from NewsAPI ──────────────────────────────────────────
async function fetchArticles(newsKey: string) {
  const articles: { title: string; description: string | null; source: string; url: string; publishedAt: string }[] = [];
  const seen = new Set<string>();
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  for (const q of QUERIES) {
    if (articles.length >= 40) break;
    try {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "15",
        from,
        apiKey: newsKey,
      });
      const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
        next: { revalidate: 21600 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles ?? []) {
        if (!seen.has(a.url)) {
          seen.add(a.url);
          articles.push({
            title: a.title,
            description: a.description ?? null,
            source: a.source?.name ?? "Unknown",
            url: a.url,
            publishedAt: a.publishedAt,
          });
        }
      }
    } catch {
      // continue with next query
    }
  }
  return articles.slice(0, 40);
}

// ── Main exported function ────────────────────────────────────────────────────
export async function getLiveDeals(): Promise<RumouredDeal[]> {
  const hit = cache.get("deals");
  if (hit && Date.now() - hit.generatedAt < CACHE_TTL) return hit.deals;

  const newsKey = process.env.NEWS_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!newsKey || !groqKey) return [];

  const articles = await fetchArticles(newsKey);
  if (articles.length === 0) return [];

  const snippets = articles
    .map((a, i) => `[${i + 1}] ${a.source} (${a.publishedAt.slice(0, 10)}) — "${a.title}"\n${a.description ?? "(no description)"}`)
    .join("\n\n");

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: `Extract qualifying M&A deals from these ${articles.length} articles:\n\n${snippets}` },
      ],
      temperature: 0.1,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? '{"deals":[]}';
    let extracted: RumouredDeal[] = [];

    try {
      const parsed = JSON.parse(raw);
      const arr: Partial<RumouredDeal>[] = Array.isArray(parsed) ? parsed : (parsed.deals ?? []);
      extracted = arr
        .filter(
          (d) =>
            typeof d.acquirerName === "string" && d.acquirerName.length > 1 &&
            typeof d.targetName === "string" && d.targetName.length > 1 &&
            ["Merger", "Acquisition", "Buyout", "PE Deal", "Strategic Review"].includes(d.dealType as string) &&
            ["Rumour", "Talks Confirmed", "Under Review"].includes(d.status as string)
        )
        .map((d) => ({
          ...d,
          acquirerLogo: "",
          targetLogo: "",
          acquirerTicker: d.acquirerTicker ?? "PRIVATE",
          targetTicker: d.targetTicker ?? "PRIVATE",
          estimatedValueNum: d.estimatedValueNum ?? 0,
        } as RumouredDeal));
    } catch {
      extracted = [];
    }

    cache.set("deals", { deals: extracted, generatedAt: Date.now() });
    return extracted;
  } catch {
    return [];
  }
}
