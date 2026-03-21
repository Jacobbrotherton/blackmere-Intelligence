import { NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

let cache: unknown = null;
let cacheTime = 0;

export async function GET() {
  if (cache && Date.now() - cacheTime < 6 * 60 * 60 * 1000) {
    return NextResponse.json(cache);
  }

  try {
    const response = await groqChat(
      "You are an M&A market analyst. Return ONLY valid JSON, no markdown, no backticks.",
      `Generate current M&A sector activity data for these sectors:
Technology, Healthcare, Financials, Energy, Industrials, Private Equity,
Media, Retail, Real Estate, Consumer.

Return a JSON object: { "sectors": [...] } where each sector has:
{ "sector": "name", "dealCount": number, "avgPremium": "XX%",
  "momentum": "hot|warm|cool", "trend": "brief trend description" }

Base this on realistic current M&A market conditions. Return ONLY the JSON object.`
    );

    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleaned);
    cache = data;
    cacheTime = Date.now();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sector heatmap error:", error);
    return NextResponse.json({ error: "Failed to generate heatmap" }, { status: 500 });
  }
}
