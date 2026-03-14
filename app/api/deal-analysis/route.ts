import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ── In-memory cache (1-hour TTL per deal) ─────────────────────────────────────
const cache = new Map<string, { analysis: string; sources: SourceArticle[]; generatedAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface SourceArticle {
  title: string;
  description: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

const SYSTEM_PROMPT = `You are a senior M&A analyst at a top-tier investment bank writing an institutional-grade deal intelligence report.

Write a comprehensive analysis using these exact sections:

**EXECUTIVE SUMMARY**
3-4 sentences covering the deal, parties involved, deal size, and current status.

**STRATEGIC RATIONALE**
4-5 sentences explaining why the acquirer wants this target — product gaps, market share, synergies, defensive positioning, and management commentary where available.

**TARGET PROFILE**
3-4 sentences on the target company's business model, revenue, growth trajectory, competitive position, and why it is an attractive asset.

**MARKET & SECTOR CONTEXT**
3-4 sentences on the sector trends driving M&A activity, comparable recent transactions, and valuation multiples context.

**REGULATORY & DEAL RISK**
3-4 sentences covering antitrust concerns, key regulatory jurisdictions, political risk, and financing considerations.

**SHAREHOLDER & MARKET IMPACT**
3 sentences on what the deal means for shareholders of both parties, likely market reaction, and analyst consensus.

**TIMELINE OUTLOOK**
2 sentences on when a deal could be formally announced or concluded, and key milestones to watch.

Use precise financial language. Reference specific figures and comparable deals. Be analytical, not promotional.`;

async function fetchRelatedArticles(
  acquirer: string,
  target: string,
  newsKey: string
): Promise<SourceArticle[]> {
  const queries = [
    `"${acquirer}" "${target}" acquisition merger`,
    `"${target}" takeover buyout deal`,
    `"${acquirer}" M&A acquisition`,
  ];

  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const articles: SourceArticle[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (articles.length >= 20) break;
    try {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "relevancy",
        pageSize: "10",
        from,
        apiKey: newsKey,
      });
      const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles ?? []) {
        if (!seen.has(a.url)) {
          seen.add(a.url);
          articles.push({
            title: a.title,
            description: a.description ?? null,
            source: a.source.name,
            url: a.url,
            publishedAt: a.publishedAt,
          });
        }
      }
    } catch {
      // continue with next query
    }
  }

  return articles.slice(0, 20);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dealId = searchParams.get("dealId")?.trim() ?? "";
  const acquirer = searchParams.get("acquirer")?.trim() ?? "";
  const target = searchParams.get("target")?.trim() ?? "";
  const value = searchParams.get("value")?.trim() ?? "";
  const summary = searchParams.get("summary")?.trim() ?? "";

  if (!dealId || !acquirer || !target) {
    return NextResponse.json({ error: "dealId, acquirer, and target are required" }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  // Return cached result if fresh
  const hit = cache.get(dealId);
  if (hit && Date.now() - hit.generatedAt < CACHE_TTL) {
    return NextResponse.json({ ...hit, cached: true });
  }

  const newsKey = process.env.NEWS_API_KEY ?? "";
  const sources = newsKey ? await fetchRelatedArticles(acquirer, target, newsKey) : [];

  const snippets = sources
    .map((a, i) => `[${i + 1}] ${a.source} — "${a.title}"\n${a.description ?? "(no description)"}`)
    .join("\n\n");

  const userMessage = [
    `Write a full institutional deal intelligence report for the following rumoured transaction:`,
    ``,
    `ACQUIRER: ${acquirer}`,
    `TARGET: ${target}`,
    `ESTIMATED VALUE: ${value}`,
    `DEAL BACKGROUND: ${summary}`,
    ``,
    snippets
      ? `SUPPORTING NEWS SOURCES (${sources.length} articles):\n${snippets}`
      : `(No additional live sources available — base analysis on the deal background and your knowledge of the companies and sector.)`,
  ].join("\n");

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.25,
      max_tokens: 1800,
    });

    const analysis = completion.choices[0]?.message?.content ?? "";
    const result = { analysis, sources, generatedAt: Date.now() };
    cache.set(dealId, result);

    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
