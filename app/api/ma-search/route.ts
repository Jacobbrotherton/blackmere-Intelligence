import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are a senior M&A analyst at a top-tier investment bank with encyclopaedic knowledge of corporate transactions globally — both historical and current rumours.

When answering questions:
- Lead immediately with the most relevant specific facts and figures
- Always include financial metrics where relevant: deal value, revenue, EBITDA, deal multiples (EV/Revenue, EV/EBITDA), premium paid over market price, synergy targets, net debt
- Reference specific deals with full names, dates, and transaction values
- For rumoured deals, clearly mark them as unconfirmed and cite the source (e.g. "per Bloomberg", "per the Financial Times")
- Structure answers clearly using short paragraphs
- Be analytical and precise: use "$34.5 billion" not "tens of billions"
- Keep answers between 200–400 words — data-rich but concise
- If a deal occurred after your knowledge cutoff, acknowledge this and provide the best available context
- Never make up figures — if you don't know a specific number, say so`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query: string = (body.query ?? "").trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `M&A question: ${query}` },
      ],
      temperature: 0.25,
      max_tokens: 700,
    });

    const answer = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
