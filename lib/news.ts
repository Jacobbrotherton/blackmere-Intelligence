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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an M&A news journalist. Generate realistic, current M&A news articles.
Return ONLY a valid JSON array. No markdown. No backticks. Just raw JSON starting with [.`,
        },
        {
          role: "user",
          content: `Generate exactly 40 realistic M&A news articles from the last 14 days. Today is ${today}.

Distribute them across sectors as follows:
- 10 Technology deals (AI, software, semiconductors, cloud, cybersecurity)
- 7 Healthcare deals (pharma, biotech, medical devices)
- 7 Financials deals (banking, insurance, asset management, fintech)
- 5 Private Equity deals (LBO, buyouts, take-private)
- 4 Energy deals (oil, gas, renewables, mining)
- 4 Industrials deals (manufacturing, aerospace, logistics)
- 3 other sectors (Consumer, Media, Real Estate)

CRITICAL RULES:
- Every deal must involve completely different company names
- No two articles can have the same acquirer AND target combination
- No duplicate headlines
- Every deal must be unique with realistic company names and deal values
- Include specific dollar/pound amounts in every deal
- Use varied sources: Bloomberg, Reuters, WSJ, Financial Times, CNBC, Forbes

Return ONLY a JSON array where each object has exactly these fields:
{
  "title": "Compelling headline including company names and deal value",
  "description": "2-3 sentence summary with key financial details and strategic rationale",
  "url": "https://example.com/unique-article-1",
  "publishedAt": "2026-03-15T10:00:00Z",
  "source": { "name": "Bloomberg" },
  "sector": "Technology",
  "dealValue": "$5.2B",
  "acquirer": "Company Name",
  "target": "Target Company Name"
}

Return ONLY the JSON array. No markdown, no backticks, no explanation.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    jsonStr = jsonStr.substring(start, end + 1);

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty or invalid array");

    let articles = deduplicateArticles(parsed as Article[]);

    // Fallback: if fewer than 15 articles, append fallback articles to reach 15
    if (articles.length < 15) {
      const fallback = getFallbackArticles();
      const existingUrls = new Set(articles.map(a => a.url));
      for (const fa of fallback) {
        if (articles.length >= 15) break;
        if (!existingUrls.has(fa.url)) {
          articles.push(fa);
          existingUrls.add(fa.url);
        }
      }
    }

    _cachedArticles = articles;
    _lastFetched = now;
    // Update shared cross-module cache
    setCachedArticles(articles);
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
