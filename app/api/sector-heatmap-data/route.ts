import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Energy & Utilities",
  "Consumer Goods",
  "Industrials",
  "Real Estate",
  "Media & Telecom",
  "Pharma & Biotech",
  "Transport & Logistics",
  "Defence & Aerospace",
];

export async function GET() {
  try {
    const prompt = `You are an M&A market analyst. Based on your knowledge of recent M&A deal activity trends, estimate the relative deal volume for each of the following sectors over the most recent period (current) versus the prior comparable period.

Return ONLY a valid JSON array with no explanation, no markdown, no preamble. Each object must have:
- "sector": the sector name (exactly as given)
- "current": integer deal count estimate for the current period (0–50 range)
- "prior": integer deal count estimate for the prior period (0–50 range)

Sectors:
${SECTORS.join("\n")}

Return format (example):
[{"sector":"Technology","current":32,"prior":28},...]`;

    const raw = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a financial data assistant. Always respond with valid JSON only — no markdown, no explanations." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const text = raw.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const data = JSON.parse(jsonMatch[0]) as { sector: string; current: number; prior: number }[];

    // Validate and fill any missing sectors
    const map: Record<string, { current: number; prior: number }> = {};
    for (const item of data) {
      if (item.sector && typeof item.current === "number" && typeof item.prior === "number") {
        map[item.sector] = { current: item.current, prior: item.prior };
      }
    }

    const result = SECTORS.map((sector) => ({
      sector,
      current: map[sector]?.current ?? 0,
      prior: map[sector]?.prior ?? 0,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[sector-heatmap-data]", err);
    // Return zeros so the UI doesn't break
    return NextResponse.json(
      SECTORS.map((sector) => ({ sector, current: 0, prior: 0 })),
      { status: 200 }
    );
  }
}
