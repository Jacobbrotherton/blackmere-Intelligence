import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const revalidate = 300; // cache for 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const period = searchParams.get('period') || 'YTD';

  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are an M&A data analyst. Today's date is ${today}.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.

The array must contain exactly 12 objects, one for each sector below, with this structure:
{ "sector": string, "deals": number, "change": string }

Where:
- "deals" = estimated number of M&A deals in the ${region} region for the ${period} period in ${new Date().getFullYear()}
- "change" = percentage change vs the same period in the prior year, formatted as "+X.X%" or "-X.X%"
- Use your knowledge of recent M&A trends to make these figures as realistic and accurate as possible
- Reflect actual market conditions: e.g. Tech is usually highest volume, Real Estate is subdued in high-rate environments, Defence is rising, Consumer is mixed
- The figures must differ meaningfully between regions (UK is smaller volume than US, Europe is mid-range) and between periods (Q1 is ~25-30% of YTD annual run rate, 12M is the full trailing year)

Sectors (use these exact names):
Technology, Healthcare, Financial Services, Energy & Utilities, Consumer Goods, Industrials, Real Estate, Media & Telecom, Pharma & Biotech, Transport & Logistics, Defence & Aerospace, Private Equity

Region: ${region}
Period: ${period}

Return only the raw JSON array, starting with [ and ending with ].`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json({ data, region, period, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Heatmap Groq error:', err);
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
