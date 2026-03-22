import { setCachedArticles, getCachedArticles, isCacheStale } from "@/lib/article-cache";

export interface Article {
  title: string;
  description: string | null;
  url: string;
  urlToImage?: string | null;
  publishedAt: string;
  source: { name: string };
  sector?: string;
  dealValue?: string;
  acquirer?: string;
  target?: string;
}

const MA_KEYWORDS = [
  "merger", "mergers", "acquisition", "acquisitions",
  "acquired", "acquires", "buyout", "buy-out",
  "takeover", "take-private", "take private",
  "divestiture", "divestment", "m&a",
];

const TITLE_EXCLUSIONS = [
  "coach", "coaching", "players", "athlete",
  "baseball", "basketball", "football", "soccer",
  "nba", "nfl", "nhl", "mlb", "esports",
  "at no reserve", "for sale",
  "land acquisition", "talent acquisition", "customer acquisition",
  "ideological", "military", "government takeover",
  "outlook takeover", "threat",
];

// Title must also contain a financial signal for it to qualify
const FINANCIAL_TITLE_SIGNALS = [
  "billion", "million", "deal", "buy", "purchase", "sold",
  "company", "corp", "inc", "ltd", "group", "holdings", "plc",
  "private equity", "investors", "board", "stake", "equity",
  "fund", "shares", "firm", "bank", "capital",
];

export function isGenuineMA(title: string, description: string | null): boolean {
  const t = title.toLowerCase();
  const full = `${t} ${(description ?? "").toLowerCase()}`;
  if (!MA_KEYWORDS.some((kw) => t.includes(kw))) return false;
  if (TITLE_EXCLUSIONS.some((ex) => t.includes(ex))) return false;
  // Require financial language in the full text (title + description)
  if (!FINANCIAL_TITLE_SIGNALS.some((s) => full.includes(s))) return false;
  return true;
}

export const SECTOR_MAP = [
  {
    id: "technology",
    label: "Technology",
    keywords: ["tech", "software", "ai", "cloud", "semiconductor", "saas",
      "digital", "data", "chip", "cyber", "internet", "platform", "fintech"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    keywords: ["pharma", "biotech", "hospital", "drug", "medical", "health",
      "clinical", "therapeutic", "vaccine", "biopharma", "life science"],
  },
  {
    id: "financials",
    label: "Financials",
    keywords: ["bank", "banking", "insurance", "financial", "fund", "credit",
      "lender", "asset management", "wealth", "capital markets"],
  },
  {
    id: "energy",
    label: "Energy",
    keywords: ["oil", "gas", "energy", "renewable", "solar", "mining",
      "petroleum", "lng", "nuclear", "wind", "power", "coal"],
  },
  {
    id: "industrials",
    label: "Industrials",
    keywords: ["industrial", "manufacturing", "aerospace", "defense",
      "logistics", "transport", "construction", "infrastructure", "chemical"],
  },
  {
    id: "private-equity",
    label: "Private Equity",
    keywords: ["private equity", "buyout", "kkr", "blackstone", "carlyle",
      "apollo", "warburg", "take-private", "leveraged", "pe firm"],
  },
] as const;

export type SectorId = (typeof SECTOR_MAP)[number]["id"];

export function getSector(title: string, description: string | null): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  for (const s of SECTOR_MAP) {
    if (s.keywords.some((kw) => text.includes(kw))) return s.label;
  }
  return "M&A";
}

export function getSectorId(title: string, description: string | null): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  for (const s of SECTOR_MAP) {
    if (s.keywords.some((kw) => text.includes(kw))) return s.id;
  }
  return "all-deals";
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Extract a deal value (in dollars as a number) from text, or null if none found. */
export function extractDealValue(text: string): number | null {
  const t = text.replace(/,/g, "");

  const mTrillion = /\$\s*([\d.]+)\s*(?:trillion|tn)\b/i.exec(t);
  if (mTrillion) return parseFloat(mTrillion[1]) * 1e12;

  const mBillion = /\$\s*([\d.]+)\s*(?:billion|bn|b)\b/i.exec(t);
  if (mBillion) return parseFloat(mBillion[1]) * 1e9;

  const mMillion = /\$\s*([\d.]+)\s*(?:million|mn|m)\b/i.exec(t);
  if (mMillion) {
    const val = parseFloat(mMillion[1]);
    if (val >= 10) return val * 1e6; // filter out tiny false-positives
  }
  return null;
}

/** Format a dollar value for display */
export function formatDealValue(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}t`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}bn`;
  if (n >= 1e6)  return `$${Math.round(n / 1e6)}m`;
  return `$${n.toLocaleString()}`;
}

/** Compute live stats from the current news feed. */
export function computeMarketStats(articles: Article[]) {
  const total = articles.length;

  const values: number[] = [];
  for (const a of articles) {
    const v = extractDealValue(`${a.title} ${a.description ?? ""}`);
    if (v !== null) values.push(v);
  }
  const totalValue = values.reduce((sum, v) => sum + v, 0);
  const avgValue = values.length > 0 ? totalValue / values.length : 0;

  const hostile = articles.filter((a) =>
    `${a.title} ${a.description ?? ""}`.toLowerCase().includes("hostile")
  ).length;

  const crossBorder = articles.filter((a) => {
    const t = `${a.title} ${a.description ?? ""}`.toLowerCase();
    return ["cross-border", "cross border", "foreign acquisition",
      "international acquisition", "overseas acquisition", "global deal",
    ].some((kw) => t.includes(kw));
  }).length;

  const sectorSet = new Set(articles.map((a) => getSector(a.title, a.description)));
  sectorSet.delete("M&A");

  return {
    total,
    totalValueStr: values.length > 0 ? formatDealValue(totalValue) : "N/A",
    avgValueStr: avgValue > 0 ? formatDealValue(avgValue) : "N/A",
    hostile,
    crossBorder,
    crossBorderPct: total > 0 ? Math.round((crossBorder / total) * 100) : 0,
    sectors: sectorSet.size,
    valuesFound: values.length,
  };
}

function deduplicateArticles(articles: Article[]): Article[] {
  const seenTitles = new Set<string>();
  const seenDeals = new Set<string>();
  return articles.filter(article => {
    const titleKey = article.title?.toLowerCase().split(' ').slice(0, 6).join('-') ?? '';
    const dealKey = `${article.acquirer?.toLowerCase()}-${article.target?.toLowerCase()}`;
    if (seenTitles.has(titleKey) || seenDeals.has(dealKey)) return false;
    seenTitles.add(titleKey);
    if (article.acquirer && article.target) seenDeals.add(dealKey);
    return true;
  });
}

// Server-side in-memory cache (persists across requests within the same process)
let _cachedArticles: Article[] = [];
let _lastFetched = 0;
const CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Parse a raw Groq response string into an Article array, or return [] on failure */
function parseGroqResponse(raw: string): Article[] {
  try {
    let jsonStr = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    jsonStr = jsonStr.substring(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed as Article[];
  } catch {
    return [];
  }
}


export async function fetchMaNews(): Promise<Article[]> {
  const now = Date.now();

  // Check local cache first
  if (_cachedArticles.length > 0 && now - _lastFetched < CACHE_MS) {
    return _cachedArticles;
  }

  // Check shared cross-module cache
  if (!isCacheStale() && getCachedArticles().length > 0) {
    return getCachedArticles() as Article[];
  }

  if (!process.env.GROQ_API_KEY) {
    console.warn("[fetchMaNews] GROQ_API_KEY not set — returning fallback");
    return getFallbackArticles();
  }

  try {
    const { default: Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const today = new Date().toISOString().split('T')[0];

    const SYSTEM = `You are an M&A news journalist. Generate realistic, current M&A news articles.
Return ONLY a valid JSON array. No markdown. No backticks. Just raw JSON starting with [.`;

    // Split into 2 parallel calls — smaller = more reliable JSON output
    const [res1, res2] = await Promise.allSettled([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Generate exactly 40 realistic M&A articles from the last 14 days. Today is ${today}.

Sectors (MUST hit these minimums):
- 20 Technology (AI, software, semiconductors, cloud, cybersecurity, SaaS)
- 12 Healthcare (pharma, biotech, medical devices, life sciences)
- 8 Financials (banking, insurance, asset management, fintech)

RULES: Only PENDING or recently ANNOUNCED deals (not closed). Unique company names throughout. Specific deal values. Varied sources (Bloomberg, Reuters, WSJ, FT, CNBC).

Return ONLY a JSON array, each item: {"title":"...","description":"...","url":"https://example.com/a1-${now}-INDEX","publishedAt":"${today}T09:00:00Z","source":{"name":"Bloomberg"},"sector":"Technology","dealValue":"$3.2B","acquirer":"Company A","target":"Company B"}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Generate exactly 40 realistic M&A articles from the last 14 days. Today is ${today}.

Sectors (MUST hit these minimums):
- 8 Financials (insurance, asset management, fintech, payments, wealth management)
- 12 Private Equity (LBO, leveraged buyouts, take-private, growth equity, venture)
- 10 Energy (oil, gas, renewables, solar, wind, mining, LNG, nuclear)
- 10 Industrials (manufacturing, aerospace, defense, logistics, construction, chemicals)

RULES: Only PENDING or recently ANNOUNCED deals (not closed). Unique company names throughout. Specific deal values. Varied sources (Bloomberg, Reuters, WSJ, FT, CNBC).

Return ONLY a JSON array, each item: {"title":"...","description":"...","url":"https://example.com/a2-${now}-INDEX","publishedAt":"${today}T09:00:00Z","source":{"name":"Reuters"},"sector":"Energy","dealValue":"$2.1B","acquirer":"Company C","target":"Company D"}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    ]);

    const batch1 = res1.status === "fulfilled"
      ? parseGroqResponse(res1.value.choices[0]?.message?.content ?? "")
      : [];
    const batch2 = res2.status === "fulfilled"
      ? parseGroqResponse(res2.value.choices[0]?.message?.content ?? "")
      : [];

    if (res1.status === "rejected") console.error("[fetchMaNews] batch1 failed:", res1.reason);
    if (res2.status === "rejected") console.error("[fetchMaNews] batch2 failed:", res2.reason);

    let articles = deduplicateArticles([...batch1, ...batch2]);

    // If either batch failed, supplement with fallback to ensure minimum coverage
    if (articles.length < 30) {
      console.warn(`[fetchMaNews] Only ${articles.length} articles — supplementing with fallback`);
      const fallback = getFallbackArticles();
      const existingUrls = new Set(articles.map(a => a.url));
      for (const fa of fallback) {
        if (!existingUrls.has(fa.url)) {
          articles.push(fa);
          existingUrls.add(fa.url);
        }
      }
    }

    _cachedArticles = articles;
    _lastFetched = now;
    setCachedArticles(articles);
    console.log(`[fetchMaNews] Generated ${articles.length} articles (batch1: ${batch1.length}, batch2: ${batch2.length})`);
    return _cachedArticles;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[fetchMaNews] Groq failed:", msg);
    return getFallbackArticles();
  }
}

function getFallbackArticles(): Article[] {
  const now = new Date().toISOString();
  return [
    {
      title: "Microsoft in Advanced Talks to Acquire Cybersecurity Firm for $8.5B",
      description: "Microsoft is reportedly in advanced acquisition talks with a leading cybersecurity company as it looks to strengthen its enterprise security offerings. The deal would be one of the largest cybersecurity acquisitions of 2026.",
      url: "https://example.com/microsoft-acquisition",
      publishedAt: now,
      source: { name: "Bloomberg" },
      sector: "Technology",
      dealValue: "$8.5B",
      acquirer: "Microsoft",
      target: "CyberSec Corp",
    },
    {
      title: "Apollo Global Targets UK Retailer in £3.2B Leveraged Buyout",
      description: "Private equity giant Apollo Global Management is pursuing a leveraged buyout of a major UK retailer. The deal would take the company private amid challenging market conditions.",
      url: "https://example.com/apollo-retail",
      publishedAt: now,
      source: { name: "Financial Times" },
      sector: "Private Equity",
      dealValue: "£3.2B",
      acquirer: "Apollo Global",
      target: "UK Retailer",
    },
    {
      title: "Pfizer Acquires Biotech Startup in $4.1B Deal to Bolster Pipeline",
      description: "Pfizer has completed its acquisition of a biotech startup specialising in oncology treatments. The deal adds several promising late-stage candidates to Pfizer's development pipeline.",
      url: "https://example.com/pfizer-biotech",
      publishedAt: now,
      source: { name: "Reuters" },
      sector: "Healthcare",
      dealValue: "$4.1B",
      acquirer: "Pfizer",
      target: "BioTech Innovations",
    },
    {
      title: "Blackstone Acquires Data Centre Operator for $6.7B Amid AI Boom",
      description: "Blackstone has agreed to acquire a major data centre operator for $6.7 billion, betting on surging demand for compute infrastructure driven by artificial intelligence workloads.",
      url: "https://example.com/blackstone-datacentre",
      publishedAt: now,
      source: { name: "WSJ" },
      sector: "Private Equity",
      dealValue: "$6.7B",
      acquirer: "Blackstone",
      target: "DataCentre Corp",
    },
    {
      title: "ExxonMobil Agrees $9.3B Acquisition of LNG Producer",
      description: "ExxonMobil has signed a definitive agreement to acquire an independent LNG producer for $9.3 billion, expanding its global natural gas footprint as energy transition pressures mount.",
      url: "https://example.com/exxon-lng",
      publishedAt: now,
      source: { name: "Reuters" },
      sector: "Energy",
      dealValue: "$9.3B",
      acquirer: "ExxonMobil",
      target: "LNG Producer",
    },
  ];
}
