import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

// Cache quotes for 5 minutes per ticker
const cache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "No ticker" }, { status: 400 });

  const hit = cache.get(ticker);
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    const response = await groqChat(
      "You are a financial data assistant. Return ONLY valid JSON, no markdown, no explanation.",
      `Provide realistic current market data for the stock ticker ${ticker}.
Return ONLY this JSON object:
{
  "symbol": "${ticker}",
  "name": "Full company name",
  "price": 123.45,
  "changesPercentage": 1.23,
  "change": 1.50,
  "marketCap": 500000000000,
  "sector": "Technology"
}
Use realistic approximate figures based on your knowledge of this company. price and changesPercentage must be numbers.`
    );

    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const data = JSON.parse(cleaned.slice(start, end + 1));

    cache.set(ticker, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ symbol: ticker, price: null, changesPercentage: null });
  }
}
