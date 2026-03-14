import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export interface RelatedArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
}

export interface BriefingResult {
  briefing: string;
  sources: RelatedArticle[];
  generatedAt: number;
  cached: boolean;
}

// ── Server-side in-memory cache (5-min TTL) ──────────────────────────────────
const cache = new Map<string, Omit<BriefingResult, "cached">>();
const CACHE_TTL = 5 * 60 * 1000;

// ── Groq system prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  "You are a senior M&A analyst writing for a professional financial audience. " +
  "Based only on the news snippets provided, write a structured deal briefing with these exact sections: " +
  "DEAL OVERVIEW (2 sentences summarising who is acquiring who and for how much), " +
  "STRATEGIC RATIONALE (2-3 sentences on why this deal is happening), " +
  "MARKET CONTEXT (2 sentences on sector trends and comparable deals), " +
  "REGULATORY & TIMELINE OUTLOOK (1-2 sentences on expected approvals and closing date), and " +
  "ANALYST PERSPECTIVE (2 sentences on what this means for shareholders and the industry). " +
  "Use precise financial language. Do not invent facts not present in the sources.";

// ── Fetch related articles from NewsAPI ───────────────────────────────────────
async function fetchRelated(
  headline: string,
  apiKey: string
): Promise<RelatedArticle[]> {
  // Extract meaningful keywords (>4 chars, not common stop-words)
  const STOP = new Set([
    "which", "their", "would", "about", "after", "these", "there",
    "where", "being", "other", "could", "should", "since", "until",
    "under", "while", "before", "during", "company",
  ]);
  const words = headline
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP.has(w.toLowerCase()))
    .slice(0, 6);

  if (words.length === 0) return [];

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    q: words.join(" OR "),
    language: "en",
    sortBy: "publishedAt",
    pageSize: "20",
    from,
    apiKey,
  });

  try {
    const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).slice(0, 20).map(
      (a: {
        title: string;
        description: string | null;
        url: string;
        source: { name: string };
        publishedAt: string;
      }) => ({
        title: a.title,
        description: a.description ?? null,
        url: a.url,
        source: a.source.name,
        publishedAt: a.publishedAt,
      })
    );
  } catch {
    return [];
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const headline = searchParams.get("headline")?.trim() ?? "";
  const url = searchParams.get("url")?.trim() ?? "";

  if (!headline || !url) {
    return NextResponse.json(
      { error: "headline and url are required" },
      { status: 400 }
    );
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  // Return cached result if fresh
  const hit = cache.get(url);
  if (hit && Date.now() - hit.generatedAt < CACHE_TTL) {
    return NextResponse.json({ ...hit, cached: true } satisfies BriefingResult);
  }

  // Fetch related articles (best-effort; proceed even if NewsAPI is unavailable)
  const newsKey = process.env.NEWS_API_KEY ?? "";
  const sources = newsKey ? await fetchRelated(headline, newsKey) : [];

  // Build Groq user message
  const snippets = sources
    .map(
      (a, i) =>
        `[${i + 1}] ${a.source} — "${a.title}"\n${a.description ?? "(no description)"}`
    )
    .join("\n\n");

  const userMessage = snippets
    ? `Write a deal briefing for this headline:\n"${headline}"\n\nRelated news snippets:\n${snippets}`
    : `Write a deal briefing for this headline:\n"${headline}"\n\n(No additional sources available — base your analysis on what can be reasonably inferred from the headline alone.)`;

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 900,
    });

    const briefing = completion.choices[0]?.message?.content ?? "";
    const result = { briefing, sources, generatedAt: Date.now() };
    cache.set(url, result);

    return NextResponse.json({ ...result, cached: false } satisfies BriefingResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
