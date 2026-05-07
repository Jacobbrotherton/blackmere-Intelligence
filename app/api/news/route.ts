export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { homepageArticles } from "@/lib/homepage-articles";

// News articles are now served from the hardcoded lib/homepage-articles.ts file.
// No Groq API calls are made.
export async function GET() {
  return NextResponse.json(
    { articles: homepageArticles, fromCache: false },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" } }
  );
}
