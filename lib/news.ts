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

// Three complementary queries run in parallel to maximise article volume
const FETCH_QUERIES = [
  "merger OR acquisition OR buyout OR takeover",
  "acquires OR acquired OR \"deal signed\" OR \"deal closed\"",
  "\"private equity\" OR \"leveraged buyout\" OR LBO OR \"hostile bid\"",
] as const;

export async function fetchMaNews(): Promise<Article[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const results = await Promise.allSettled(
    FETCH_QUERIES.map((q) => {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "100",
        searchIn: "title",
        apiKey,
      });
      return fetch(`https://newsapi.org/v2/everything?${params}`, {
        next: { revalidate: 300 },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    })
  );

  const seen = new Set<string>();
  const articles: Article[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const a of result.value.articles ?? []) {
      if (seen.has(a.url)) continue;
      if (!isGenuineMA(a.title, a.description)) continue;
      seen.add(a.url);
      articles.push(a);
    }
  }

  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return articles;
}
