import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Blackmere Intelligence's expert M&A Deal Analyst — a senior investment banking professional with 20 years of experience in mergers, acquisitions, private equity, and corporate strategy.

You specialise in:
- Analysing M&A rumours and assessing deal probability
- Comparing deals to historical precedents
- Identifying strategic rationale for acquisitions
- Assessing regulatory and antitrust risk
- Calculating valuation metrics (EV/EBITDA, premium to market, etc.)
- Understanding PE buyout dynamics and financing structures

Always be analytical, precise and professional. Back up assessments with comparable deals, figures and market context. Keep responses focused and structured. This is a premium intelligence service — quality matters.

Always end with a brief disclaimer that responses are analytical opinion, not financial advice.`
        },
        ...messages
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content ?? "Unable to generate response."
    });
  } catch (error: unknown) {
    console.error("Deal analyst error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
