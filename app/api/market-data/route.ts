import { NextRequest, NextResponse } from "next/server";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase().trim();
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const key = process.env.FINANCIAL_MODDELING_PREP_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "FMP API key not configured" }, { status: 500 });
  }

  try {
    const [quoteRes, profileRes, metricsRes] = await Promise.all([
      fetch(`${FMP_BASE}/quote/${ticker}?apikey=${key}`,       { next: { revalidate: 300 } }),
      fetch(`${FMP_BASE}/profile/${ticker}?apikey=${key}`,     { next: { revalidate: 3600 } }),
      fetch(`${FMP_BASE}/key-metrics/${ticker}?limit=1&apikey=${key}`, { next: { revalidate: 3600 } }),
    ]);

    const [quoteData, profileData, metricsData] = await Promise.all([
      quoteRes.ok   ? quoteRes.json()   : null,
      profileRes.ok ? profileRes.json() : null,
      metricsRes.ok ? metricsRes.json() : null,
    ]);

    return NextResponse.json(
      {
        quote:   quoteData?.[0]   ?? null,
        profile: profileData?.[0] ?? null,
        metrics: metricsData?.[0] ?? null,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
