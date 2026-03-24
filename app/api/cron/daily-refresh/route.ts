import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import Groq from 'groq-sdk';

const kv = new Redis({
  url: process.env.Blackmere_KV_REST_API_URL!,
  token: process.env.Blackmere_KV_REST_API_TOKEN!,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const dynamic = 'force-dynamic';

const SECTORS = [
  'technology', 'healthcare', 'financials', 'energy', 'industrials', 'private-equity',
];

const SECTOR_LABELS: Record<string, string> = {
  'technology':     'Technology',
  'healthcare':     'Healthcare',
  'financials':     'Financial Services',
  'energy':         'Energy & Utilities',
  'industrials':    'Industrials',
  'private-equity': 'Private Equity',
};

const today = new Date().toISOString().split('T')[0];

async function generateDealsForSector(sector: string): Promise<any[]> {
  const label = SECTOR_LABELS[sector];
  const prompt = `You are an M&A data analyst. Today is ${today}.

Generate exactly 12 realistic M&A deals in the ${label} sector from the past 6 months.
Return ONLY a valid JSON array, no markdown, no explanation.

Each object must have:
- "id": unique string slug
- "title": "[Acquirer] acquires [Target]" or "[Acquirer] to acquire [Target]"
- "acquirer": acquirer company name
- "target": target company name
- "description": 1-2 sentence deal description
- "value": deal value like "$4.2bn" or "$850m", or null if unknown
- "date": ISO date string (YYYY-MM-DD) within last 6 months
- "status": one of "Completed", "Pending", "Announced"
- "sector": "${label}"

Use realistic company names and deal values reflecting current market conditions.
Return only the JSON array starting with [ and ending with ].`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

export async function GET(_request: Request) {
  try {
    if (!process.env.Blackmere_KV_REST_API_URL) throw new Error('Blackmere_KV_REST_API_URL is not set');
    if (!process.env.Blackmere_KV_REST_API_TOKEN) throw new Error('Blackmere_KV_REST_API_TOKEN is not set');
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

    // Generate deals for all sectors in parallel
    const results = await Promise.allSettled(
      SECTORS.map(sector => generateDealsForSector(sector))
    );

    const sectorDeals: Record<string, any[]> = {};
    const sectorCounts: Record<string, number> = {};
    const allDeals: any[] = [];

    SECTORS.forEach((sector, i) => {
      const result = results[i];
      const deals = result.status === 'fulfilled' ? result.value : [];
      sectorDeals[sector] = deals;
      sectorCounts[sector] = deals.length;
      allDeals.push(...deals);
    });

    const homepageFeed = allDeals.slice(0, 10);
    const spotlight = [...allDeals]
      .filter(d => d.value)
      .slice(0, 2);

    await kv.set('homepage-feed', JSON.stringify(homepageFeed));
    await kv.set('spotlight', JSON.stringify(spotlight));
    await kv.set('sector-counts', JSON.stringify(sectorCounts));
    await kv.set('sector-deals', JSON.stringify(sectorDeals));
    await kv.set('last-updated', new Date().toISOString());

    return NextResponse.json({
      success: true,
      totalDeals: allDeals.length,
      homepageFeed: homepageFeed.length,
      spotlight: spotlight.length,
      sectorCounts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Daily refresh failed:', message);
    return NextResponse.json({ error: 'Refresh failed', detail: message }, { status: 500 });
  }
}
