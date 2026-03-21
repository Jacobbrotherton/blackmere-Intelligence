import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { title, url } = await req.json();

  const response = await groqChat(
    `You are an expert M&A news analyst. Summarise articles into exactly 3 concise bullet points that capture the key M&A intelligence. Each bullet should be one sentence. Be precise and professional. Return ONLY the 3 bullet points, one per line, starting with the text directly (no numbers or dashes).`,
    `Summarise this M&A article in 3 bullet points:
Title: ${title}
URL: ${url}

Focus on: what the deal is, who is involved and why it matters to investors.`
  );

  const bullets = response
    .split("\n")
    .map((b: string) => b.trim())
    .filter((b: string) => b.length > 0)
    .slice(0, 3);

  return NextResponse.json({ bullets });
}
