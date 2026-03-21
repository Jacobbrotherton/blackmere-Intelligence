import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

const cache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  const name = req.nextUrl.searchParams.get("name") ?? ticker;

  if (!ticker || ticker === "PRIVATE") {
    return NextResponse.json(null);
  }

  const hit = cache.get(ticker);
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    const response = await groqChat(
      "You are a financial data analyst. Return ONLY valid JSON, no markdown, no explanation.",
      `Provide realistic market data for ${name} (ticker: ${ticker}).
Return ONLY this JSON object with realistic approximate figures based on your knowledge:
{
  "price": "$XXX.XX",
  "marketCap": "$XXX.XB",
  "peRatio": "XX.X",
  "evEbitda": "XX.X",
  "week52High": "$XXX.XX",
  "week52Low": "$XXX.XX",
  "description": "2 sentence company description",
  "sector": "Sector name",
  "exchange": "NYSE or NASDAQ"
}
All values must be strings. Use realistic figures.`
    );

    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const data = JSON.parse(cleaned.slice(start, end + 1));

    cache.set(ticker, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}
