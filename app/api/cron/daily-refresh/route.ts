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

// All 12 heatmap sectors with realistic base deal counts (Global YTD)
const HEATMAP_SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Energy & Utilities',
  'Consumer Goods', 'Industrials', 'Real Estate', 'Media & Telecom',
  'Pharma & Biotech', 'Transport & Logistics', 'Defence & Aerospace', 'Private Equity',
];

const today = new Date().toISOString().split('T')[0];
const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

function isWithinWindow(dateStr: string): boolean {
  return dateStr >= cutoff && dateStr <= today;
}

async function generateDealsForSector(sector: string): Promise<any[]> {
  const label = SECTOR_LABELS[sector];
  const prompt = `You are a financial fiction writer creating simulated M&A deal data for a demo platform. Today is ${today}.

You must invent COMPLETELY FICTIONAL companies and deals — do not use any real company names or any deals that have ever actually happened. Make up plausible-sounding company names, acquirers, and targets that do not exist in real life.

Generate exactly 12 fictional simulated M&A deals in the ${label} sector.
Every single deal "date" MUST be between ${cutoff} and ${today} — no exceptions.
Return ONLY a valid JSON array, no markdown, no explanation.

Each object must have:
- "id": unique kebab-case slug (e.g. "acmecorp-buys-techvault-2025")
- "title": "[Acquirer] acquires [Target]" or "[Acquirer] to acquire [Target]"
- "acquirer": fictional company name
- "target": fictional company name
- "description": 1-2 sentence deal rationale (AI integration, market expansion, etc.)
- "value": deal value like "$4.2bn" or "$850m", or null
- "date": ISO date string between ${cutoff} and ${today}
- "status": one of "Completed", "Pending", "Announced"
- "sector": "${label}"

Spread the 12 dates evenly across the ${cutoff} to ${today} window. Use current themes: AI, energy transition, cloud, biotech, defence, fintech.
Return only the JSON array starting with [ and ending with ].`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  // Hard filter: reject any deal whose date falls outside the 14-day window
  return parsed.filter((d: any) => d?.date && isWithinWindow(d.date));
}

export async function GET(_request: Request) {
  const authHeader = _request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Generate heatmap data — one Groq call, cached all day
    const heatmapPrompt = `You are an M&A market analyst. Today is ${today}.

Return ONLY a valid JSON array for these exactly 12 sectors, no markdown, no explanation.
Each object: { "sector": string, "deals": number, "change": string }
- "deals" = realistic Global YTD deal count (integer)
- "change" = YoY % change formatted as "+X.X%" or "-X.X%"
- Reflect real market conditions (Tech highest volume, Defence rising, Real Estate subdued)

Sectors: ${HEATMAP_SECTORS.join(', ')}

Return only the JSON array starting with [ and ending with ].`;

    const heatmapCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: heatmapPrompt }],
      temperature: 0.3,
      max_tokens: 600,
    });
    const heatmapRaw = heatmapCompletion.choices[0]?.message?.content?.trim() ?? '[]';
    const heatmapCleaned = heatmapRaw.replace(/```json|```/g, '').trim();
    const heatmapMatch = heatmapCleaned.match(/\[[\s\S]*\]/);
    const heatmapData = heatmapMatch ? JSON.parse(heatmapMatch[0]) : [];

    await kv.set('homepage-feed', homepageFeed);
    await kv.set('spotlight', spotlight);
    await kv.set('sector-counts', sectorCounts);
    await kv.set('sector-deals', sectorDeals);
    await kv.set('heatmap-base', heatmapData);
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
