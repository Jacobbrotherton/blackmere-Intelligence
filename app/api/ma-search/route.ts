import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are a senior M&A analyst at a top-tier investment bank with encyclopaedic knowledge of corporate transactions globally — both historical and current rumours.

CRITICAL RULES — follow without exception:
- Begin your response IMMEDIATELY with the answer. No preamble, no "As of my knowledge cutoff", no "I should note", no "My training data", no disclaimers about what you do or don't know at the start.
- NEVER open with a sentence about your knowledge cutoff or training data — if relevant, mention it briefly at the end only.
- NEVER say things like "I'd be happy to", "Great question", "Certainly", or any filler opener.

When answering:
- Lead with the most relevant specific facts and figures
- Always include financial metrics where relevant: deal value, revenue, EBITDA, deal multiples (EV/Revenue, EV/EBITDA), premium paid over market price, synergy targets, net debt
- Reference specific deals with full names, dates, and transaction values
- For rumoured deals, clearly mark them as unconfirmed and cite the source (e.g. "per Bloomberg", "per the Financial Times")
- Structure answers clearly using short paragraphs
- Be analytical and precise: use "$34.5 billion" not "tens of billions"
- Keep answers between 200–400 words — data-rich but concise
- Never make up figures — if you don't know a specific number, say so`;

const PREAMBLE_PATTERNS = [
  /^(as of my (knowledge cutoff|training data|last update)[^.]*\.?\s*)/i,
  /^(my knowledge cutoff[^.]*\.?\s*)/i,
  /^(i (should|must) note[^.]*\.?\s*)/i,
  /^(please note[^.]*\.?\s*)/i,
  /^(note that[^.]*\.?\s*)/i,
  /^(i'd be happy to[^.]*\.?\s*)/i,
  /^(certainly[,!.]?\s*)/i,
  /^(great question[,!.]?\s*)/i,
  /^(of course[,!.]?\s*)/i,
];

function stripPreamble(text: string): string {
  let result = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of PREAMBLE_PATTERNS) {
      const stripped = result.replace(pattern, "");
      if (stripped !== result) {
        result = stripped.trim();
        changed = true;
      }
    }
  }
  return result;
}

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

    const raw = completion.choices[0]?.message?.content ?? "";
    const answer = stripPreamble(raw);
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
