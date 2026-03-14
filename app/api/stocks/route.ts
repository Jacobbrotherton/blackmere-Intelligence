import { NextResponse } from "next/server";

const TICKERS = [
  { symbol: "MSFT", name: "Microsoft",  role: "Acquirer · Tech" },
  { symbol: "KKR",  name: "KKR",        role: "PE Acquirer" },
  { symbol: "BX",   name: "Blackstone", role: "PE Acquirer" },
  { symbol: "PFE",  name: "Pfizer",     role: "Acquirer · Healthcare" },
  { symbol: "SHEL", name: "Shell",      role: "Divesting · Energy" },
];

interface StockResult {
  symbol: string;
  name: string;
  role: string;
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
}

// Module-level cache persists between requests in the same Node.js process.
// Falls back to stale data when Alpha Vantage is rate-limited.
let stockCache: { stocks: StockResult[]; cachedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface AVQuote {
  "01. symbol": string;
  "05. price": string;
  "09. change": string;
  "10. change percent": string;
}

async function fetchQuote(symbol: string, apiKey: string): Promise<StockResult | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    // No Next.js cache — we manage caching ourselves at the module level
    cache: "no-store",
  });
  const data = await res.json();
  if (data.Information) throw new Error("rate_limited");

  const q: AVQuote = data["Global Quote"];
  if (!q || !q["05. price"]) return null;

  const change = parseFloat(q["09. change"]);
  const pct    = parseFloat(q["10. change percent"].replace("%", ""));

  return {
    symbol,
    name: TICKERS.find((t) => t.symbol === symbol)!.name,
    role: TICKERS.find((t) => t.symbol === symbol)!.role,
    price: parseFloat(q["05. price"]).toFixed(2),
    change: change.toFixed(2),
    changePercent: pct.toFixed(2),
    up: change >= 0,
  };
}

async function fetchAllQuotes(apiKey: string): Promise<StockResult[]> {
  const results = await Promise.allSettled(
    TICKERS.map((t) => fetchQuote(t.symbol, apiKey))
  );
  return results.flatMap((r) => {
    if (r.status !== "fulfilled" || !r.value) return [];
    return [r.value];
  });
}

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ALPHA_VANTAGE_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  // Return fresh cache if still within TTL
  if (stockCache && Date.now() - stockCache.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      stocks: stockCache.stocks,
      cachedAt: stockCache.cachedAt,
      stale: false,
    });
  }

  // Attempt to fetch fresh data
  try {
    const stocks = await fetchAllQuotes(apiKey);
    if (stocks.length > 0) {
      stockCache = { stocks, cachedAt: Date.now() };
    }
    return NextResponse.json({
      stocks: stocks.length > 0 ? stocks : (stockCache?.stocks ?? []),
      cachedAt: stockCache?.cachedAt ?? Date.now(),
      stale: stocks.length === 0,
    });
  } catch {
    // Return stale cache rather than an error
    if (stockCache) {
      return NextResponse.json({
        stocks: stockCache.stocks,
        cachedAt: stockCache.cachedAt,
        stale: true,
      });
    }
    return NextResponse.json(
      { stocks: [], cachedAt: null, stale: true },
      { status: 200 } // return 200 so client handles it gracefully
    );
  }
}
