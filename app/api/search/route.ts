import { NextRequest, NextResponse } from "next/server";
import { fetchMaNews, Article } from "@/lib/news";
import Groq from "groq-sdk";

function scoreArticle(article: Article, qWords: string[]): number {
  const title = article.title.toLowerCase();
  const desc = (article.description ?? "").toLowerCase();
  const source = article.source.name.toLowerCase();
  let score = 0;
  for (const word of qWords) {
    if (word.length < 2) continue;
    // Title matches are worth most
    if (title.includes(word)) score += 5 + word.length;
    // Description matches
    if (desc.includes(word)) score += 2;
    // Source name match (e.g. "Reuters", "Bloomberg")
    if (source.includes(word)) score += 3;
  }
  return score;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ articles: [] });

  const articles = await fetchMaNews();

  // Fast local keyword scoring — always runs
  const qWords = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const scored = articles
    .map((a) => ({ article: a, score: scoreArticle(a, qWords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.article);

  // If we have solid keyword results, return them immediately
  if (scored.length >= 3) {
    return NextResponse.json(
      { articles: scored },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // AI fallback — handles company names, acronyms, semantic queries
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ articles: scored });
  }

  // Feed the top 60 articles to the AI as a numbered list
  const articleList = articles
    .slice(0, 60)
    .map((a, i) => `[${i}] "${a.title}" — ${a.source.name}`)
    .join("\n");

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a search assistant for an M&A deal tracker. " +
            "Given a user search query, return the indices of the most relevant articles from the list. " +
            "Match company names, acquirer/target names, sectors, deal types, and related parties. " +
            "Return ONLY a JSON array of integers (the article indices), with no explanation. " +
            "Return at most 8 indices.",
        },
        {
          role: "user",
          content: `Query: "${q}"\n\nArticles:\n${articleList}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 120,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";
    const match = content.match(/\[[\d,\s]*\]/);
    const indices: number[] = match ? JSON.parse(match[0]) : [];

    const aiResults = indices
      .filter((i) => typeof i === "number" && i >= 0 && i < articles.length)
      .map((i) => articles[i]);

    // Merge local + AI, deduplicate
    const seen = new Set(scored.map((a) => a.url));
    const merged = [...scored];
    for (const a of aiResults) {
      if (!seen.has(a.url)) {
        seen.add(a.url);
        merged.push(a);
      }
    }

    return NextResponse.json(
      { articles: merged.slice(0, 8) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ articles: scored });
  }
}
