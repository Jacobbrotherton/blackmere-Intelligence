import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker = (body.ticker ?? "").toString().toUpperCase().trim();

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const systemPrompt = `You are a senior M&A investment banker. You MUST respond with ONLY a valid JSON object. No markdown. No backticks. No explanation before or after. Just raw JSON starting with { and ending with }.`;

    const userPrompt = `Provide acquisition analysis for the stock ticker ${ticker}.

Return ONLY this JSON object with no other text:
{
  "companyName": "Full legal company name",
  "sector": "Sector name",
  "currentPrice": "$XXX.XX",
  "marketCap": "$XX.XB",
  "peRatio": "XX.Xx",
  "yearHigh": "$XXX.XX",
  "yearLow": "$XXX.XX",
  "sectorAvgPremium": "XX-XX%",
  "estimatedOfferPrice": "$XXX.XX",
  "upsideFromCurrent": "XX%",
  "acquisitionLikelihood": "Low or Medium or High",
  "strategicRationale": "2-3 sentences on why an acquirer would want this company",
  "potentialAcquirers": "3 realistic company names separated by commas",
  "keyRisks": "1-2 sentences on main deal risks",
  "comparableDeals": "2 real historical comparable acquisitions with approximate values",
  "analystVerdict": "1 confident sentence on overall acquisition attractiveness"
}

Use realistic approximate figures based on your knowledge of ${ticker}. If ${ticker} is not a real ticker, still return valid JSON with "Unknown company" as companyName and reasonable placeholder values.`;

    const raw = await groqChat(systemPrompt, userPrompt);

    // Robust JSON extraction — strip markdown fences, find { ... }
    const jsonStr = raw.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const startIdx = jsonStr.indexOf("{");
    const endIdx = jsonStr.lastIndexOf("}");

    const fallback = {
      ticker,
      companyName: ticker,
      sector: "Unknown",
      currentPrice: "N/A",
      marketCap: "N/A",
      peRatio: "N/A",
      yearHigh: "N/A",
      yearLow: "N/A",
      sectorAvgPremium: "25-40%",
      estimatedOfferPrice: "N/A",
      upsideFromCurrent: "25-40% estimated",
      acquisitionLikelihood: "Medium",
      strategicRationale: `${ticker} could attract acquisition interest from strategic buyers given current M&A market conditions.`,
      potentialAcquirers: "Strategic industry buyers, Private equity firms",
      keyRisks: "Regulatory scrutiny, integration complexity, valuation uncertainty.",
      comparableDeals: "Comparable sector transactions available on request.",
      analystVerdict: `${ticker} shows characteristics consistent with a credible acquisition target.`,
      note: "Simplified analysis — AI formatting issue encountered.",
    };

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return NextResponse.json(fallback);
    }

    let aiData: Record<string, unknown>;
    try {
      aiData = JSON.parse(jsonStr.substring(startIdx, endIdx + 1));
    } catch {
      return NextResponse.json(fallback);
    }

    return NextResponse.json({
      ticker,
      companyName: aiData.companyName ?? ticker,
      sector: aiData.sector ?? "Unknown",
      currentPrice: aiData.currentPrice ?? "N/A",
      marketCap: aiData.marketCap ?? "N/A",
      peRatio: aiData.peRatio ?? "N/A",
      yearHigh: aiData.yearHigh ?? "N/A",
      yearLow: aiData.yearLow ?? "N/A",
      sectorAvgPremium: aiData.sectorAvgPremium ?? "25-40%",
      estimatedOfferPrice: aiData.estimatedOfferPrice ?? "N/A",
      upsideFromCurrent: aiData.upsideFromCurrent ?? "N/A",
      acquisitionLikelihood: aiData.acquisitionLikelihood ?? "Medium",
      strategicRationale: aiData.strategicRationale ?? "Analysis unavailable.",
      potentialAcquirers: aiData.potentialAcquirers ?? "N/A",
      keyRisks: aiData.keyRisks ?? "N/A",
      comparableDeals: aiData.comparableDeals ?? "N/A",
      analystVerdict: aiData.analystVerdict ?? "N/A",
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
