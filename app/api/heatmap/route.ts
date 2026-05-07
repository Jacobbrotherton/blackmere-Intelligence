import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Hardcoded sector heatmap data — refreshed 8 May 2026
// Reflects YTD 2026 M&A deal activity by sector (Global baseline)
const BASE_DATA = [
  { sector: "Technology", deals: 387, change: "+12%" },
  { sector: "Healthcare / Pharma", deals: 298, change: "+8%" },
  { sector: "Financial Services", deals: 245, change: "-3%" },
  { sector: "Energy & Utilities", deals: 189, change: "+21%" },
  { sector: "Industrials", deals: 176, change: "+5%" },
  { sector: "Consumer & Retail", deals: 134, change: "-7%" },
  { sector: "Media & Entertainment", deals: 87, change: "+33%" },
  { sector: "Telecom", deals: 76, change: "+15%" },
  { sector: "Real Estate", deals: 98, change: "-12%" },
  { sector: "Materials & Mining", deals: 65, change: "+4%" },
  { sector: "Transportation", deals: 43, change: "+9%" },
  { sector: "Private Equity", deals: 312, change: "+18%" },
];

const REGION_SCALE: Record<string, number> = { Global: 1, US: 0.48, UK: 0.18, Europe: 0.28 };
const PERIOD_SCALE: Record<string, number> = { YTD: 1, Q1: 0.30, "12M": 2.4 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || "Global";
  const period = searchParams.get("period") || "YTD";

  const regionScale = REGION_SCALE[region] ?? 1;
  const periodScale = PERIOD_SCALE[period] ?? 1;

  const data = BASE_DATA.map((item) => ({
    sector: item.sector,
    deals: Math.max(1, Math.round(item.deals * regionScale * periodScale)),
    change: item.change,
  }));

  return NextResponse.json({
    data,
    region,
    period,
    source: "hardcoded",
    fetchedAt: new Date().toISOString(),
  });
}
