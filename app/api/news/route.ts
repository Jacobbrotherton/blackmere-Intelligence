export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { setCachedArticles } from "@/lib/article-cache";

let cachedArticles: any[] = [];
let lastFetched = 0;
const CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours

function deduplicateArticles(articles: any[]): any[] {
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
          content: `Generate exactly 80 realistic M&A news articles from the last 14 days. Today is ${today}.

Distribute them across sectors as follows (MINIMUM per sector):
- 20 Technology deals (AI, software, semiconductors, cloud, cybersecurity, SaaS)
- 15 Healthcare deals (pharma, biotech, medical devices, life sciences)
- 15 Financials deals (banking, insurance, asset management, fintech, payments)
- 10 Private Equity deals (LBO, leveraged buyouts, take-private, growth equity)
- 8 Energy deals (oil, gas, renewables, solar, wind, mining, LNG)
- 8 Industrials deals (manufacturing, aerospace, defense, logistics, construction)
- 4 other sectors (Consumer, Media, Real Estate, Retail)

CRITICAL RULES:
- Every deal must involve completely different company names — no repeats across all 80
- No two articles can have the same acquirer AND target combination
- No duplicate headlines
- Every deal must be unique with realistic, specific company names and deal values
- Include specific dollar/pound/euro amounts in every deal
- Use varied sources: Bloomberg, Reuters, WSJ, Financial Times, CNBC, Forbes, S&P Global
- Vary deal sizes from $200M to $50B realistically
- Use today's date context — make deals feel current and believable

Return ONLY a JSON array where each object has exactly these fields:
{
  "title": "Compelling headline including company names and deal value",
  "description": "2-3 sentence summary with key financial details and strategic rationale",
  "url": "https://example.com/article-${Date.now()}-1",
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
      temperature: 0.8,
      max_tokens: 12000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let jsonStr = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    jsonStr = jsonStr.substring(start, end + 1);

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    let articles = deduplicateArticles(parsed);

    // Fallback: if fewer than 15 articles, append fallback articles to reach 15
    if (articles.length < 15) {
      const fallback = getFallbackArticles();
      const existingUrls = new Set(articles.map((a: any) => a.url));
      for (const fa of fallback) {
        if (articles.length >= 15) break;
        if (!existingUrls.has(fa.url)) {
          articles.push(fa);
          existingUrls.add(fa.url);
        }
      }
    }

    cachedArticles = articles;
    lastFetched = now;
    // Update shared cache
    setCachedArticles(articles);

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
    {
      title: "Blackstone Acquires Data Centre Operator for $6.7B Amid AI Boom",
      description: "Blackstone has agreed to acquire a major data centre operator for $6.7 billion, betting on surging demand for compute infrastructure driven by artificial intelligence workloads.",
      url: "https://example.com/blackstone-datacentre",
      publishedAt: new Date().toISOString(),
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
      publishedAt: new Date().toISOString(),
      source: { name: "Reuters" },
      sector: "Energy",
      dealValue: "$9.3B",
      acquirer: "ExxonMobil",
      target: "LNG Producer",
    },
    {
      title: "JPMorgan Chase Acquires Regional Bank Network for $3.8B",
      description: "JPMorgan Chase has agreed to acquire a regional bank network in a $3.8 billion deal that expands its retail banking footprint across the Midwest. The acquisition adds over 200 branches.",
      url: "https://example.com/jpmorgan-bank",
      publishedAt: new Date().toISOString(),
      source: { name: "Financial Times" },
      sector: "Financials",
      dealValue: "$3.8B",
      acquirer: "JPMorgan Chase",
      target: "MidWest Bank Group",
    },
    {
      title: "Siemens Acquires Industrial Automation Firm for €2.1B",
      description: "Siemens has announced the acquisition of a leading industrial automation company for €2.1 billion to strengthen its digital industries division and expand its factory automation capabilities.",
      url: "https://example.com/siemens-automation",
      publishedAt: new Date().toISOString(),
      source: { name: "Bloomberg" },
      sector: "Industrials",
      dealValue: "€2.1B",
      acquirer: "Siemens",
      target: "AutomationTech GmbH",
    },
  ];
}
