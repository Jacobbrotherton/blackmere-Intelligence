import { NextResponse } from "next/server";
import Groq from "groq-sdk";

let cachedArticles: any[] = [];
let lastFetched = 0;
const CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET() {
  const now = Date.now();

  if (cachedArticles.length > 0 && now - lastFetched < CACHE_MS) {
    return NextResponse.json({ articles: cachedArticles, fromCache: true });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set", articles: [] }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
          content: `Generate 20 realistic M&A news articles from the last 7 days covering mergers, acquisitions, buyouts, PE deals and divestitures across all sectors globally.

          Return ONLY a JSON array where each object has:
          {
            "title": "Compelling news headline about an M&A deal",
            "description": "2-3 sentence summary of the deal with key financial details",
            "url": "https://example.com/article",
            "publishedAt": "2026-03-21T10:00:00Z",
            "source": { "name": "Financial Times" },
            "sector": "Technology",
            "dealValue": "$5.2B",
            "acquirer": "Company Name",
            "target": "Target Company"
          }

          Make headlines specific and realistic — include company names, deal values and sectors.
          Use varied sources: Bloomberg, Reuters, WSJ, Financial Times, Forbes, CNBC.
          Cover different sectors: Technology, Healthcare, Private Equity, Energy, Financials, Consumer, Media.
          Return ONLY the JSON array.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    jsonStr = jsonStr.substring(start, end + 1);

    const articles = JSON.parse(jsonStr);
    if (!Array.isArray(articles)) throw new Error("Not an array");

    cachedArticles = articles;
    lastFetched = now;

    return NextResponse.json(
      { articles, fromCache: false },
      { headers: { "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=300" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[news] Groq failed:", msg);
    // Return fallback articles so page never shows empty
    const fallback = getFallbackArticles();
    return NextResponse.json({ articles: fallback, fromCache: false, fallback: true });
  }
}

function getFallbackArticles() {
  return [
    {
      title: "Microsoft in Advanced Talks to Acquire Cybersecurity Firm for $8.5B",
      description: "Microsoft is reportedly in advanced acquisition talks with a leading cybersecurity company as it looks to strengthen its enterprise security offerings. The deal would be one of the largest cybersecurity acquisitions of 2026.",
      url: "https://example.com/microsoft-acquisition",
      publishedAt: new Date().toISOString(),
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
      publishedAt: new Date().toISOString(),
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
      publishedAt: new Date().toISOString(),
      source: { name: "Reuters" },
      sector: "Healthcare",
      dealValue: "$4.1B",
      acquirer: "Pfizer",
      target: "BioTech Innovations",
    },
  ];
}
