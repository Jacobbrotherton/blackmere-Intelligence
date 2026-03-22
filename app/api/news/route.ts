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

function parseRaw(raw: string): any[] {
  try {
    let s = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a === -1 || b === -1) return [];
    const parsed = JSON.parse(s.substring(a, b + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
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

    const SYSTEM = `You are an M&A news journalist. Generate realistic, current M&A news articles.
Return ONLY a valid JSON array. No markdown. No backticks. Just raw JSON starting with [.`;

    // Two parallel calls — smaller batches = more reliable JSON
    const [r1, r2] = await Promise.allSettled([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Generate exactly 40 realistic M&A articles from the last 14 days. Today is ${today}.
Sectors (hit MINIMUM counts): 20 Technology (AI/software/cloud/cyber/SaaS), 12 Healthcare (pharma/biotech/medtech), 8 Financials (banking/insurance/fintech).
RULES: Only PENDING or ANNOUNCED deals (not closed). Unique companies. Specific deal values $200M-$50B. Varied sources.
Return ONLY JSON array: [{"title":"...","description":"2-3 sentences...","url":"https://bm.example/t-${now}-1","publishedAt":"${today}T09:00:00Z","source":{"name":"Bloomberg"},"sector":"Technology","dealValue":"$3.2B","acquirer":"Acme Corp","target":"Beta Inc"}]` },
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Generate exactly 40 realistic M&A articles from the last 14 days. Today is ${today}.
Sectors (hit MINIMUM counts): 8 Financials (asset mgmt/payments/wealth), 12 Private Equity (LBO/buyout/take-private), 10 Energy (oil/gas/renewables/mining), 10 Industrials (manufacturing/aerospace/logistics/defense).
RULES: Only PENDING or ANNOUNCED deals (not closed). Unique companies. Specific deal values $200M-$50B. Varied sources.
Return ONLY JSON array: [{"title":"...","description":"2-3 sentences...","url":"https://bm.example/b-${now}-1","publishedAt":"${today}T09:00:00Z","source":{"name":"Reuters"},"sector":"Energy","dealValue":"$2.1B","acquirer":"Delta Ltd","target":"Gamma SA"}]` },
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    ]);

    const batch1 = r1.status === "fulfilled" ? parseRaw(r1.value.choices[0]?.message?.content ?? "") : [];
    const batch2 = r2.status === "fulfilled" ? parseRaw(r2.value.choices[0]?.message?.content ?? "") : [];
    if (r1.status === "rejected") console.error("[news] batch1 failed:", r1.reason);
    if (r2.status === "rejected") console.error("[news] batch2 failed:", r2.reason);

    let articles = deduplicateArticles([...batch1, ...batch2]);

    if (articles.length < 15) {
      const fallback = getFallbackArticles();
      const seen = new Set(articles.map((a: any) => a.url));
      for (const fa of fallback) {
        if (!seen.has(fa.url)) { articles.push(fa); seen.add(fa.url); }
      }
    }

    cachedArticles = articles;
    lastFetched = now;
    setCachedArticles(articles);
    console.log(`[news] Generated ${articles.length} articles (b1:${batch1.length} b2:${batch2.length})`);

    return NextResponse.json(
      { articles, fromCache: false },
      { headers: { "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=300" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[news] Groq failed:", msg);
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
