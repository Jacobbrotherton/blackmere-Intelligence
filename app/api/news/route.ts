import { NextResponse } from "next/server";
import { isGenuineMA } from "@/lib/news";

const FETCH_QUERIES = [
  "merger OR acquisition OR buyout OR takeover",
  "acquires OR acquired OR \"deal signed\" OR \"deal closed\"",
  "\"private equity\" OR \"leveraged buyout\" OR LBO OR \"hostile bid\"",
] as const;

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NEWS_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  const results = await Promise.allSettled(
    FETCH_QUERIES.map((q) => {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "100",
        searchIn: "title",
        apiKey,
      });
      return fetch(`https://newsapi.org/v2/everything?${params}`, {
        next: { revalidate: 300 },
      }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    })
  );

  const seen = new Set<string>();
  const articles: { title: string; description: string | null; url: string; publishedAt: string; source: { name: string } }[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const a of result.value.articles ?? []) {
      if (seen.has(a.url)) continue;
      if (!isGenuineMA(a.title, a.description)) continue;
      seen.add(a.url);
      articles.push(a);
    }
  }

  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Cap at 30 for the live sidebar
  const trimmed = articles.slice(0, 30);

  return NextResponse.json(
    { articles: trimmed },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}
