import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import Groq from 'groq-sdk';

const kv = new Redis({
  url: process.env.Blackmere_KV_REST_API_URL!,
  token: process.env.Blackmere_KV_REST_API_TOKEN!,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SECTORS = [
  'technology', 'healthcare', 'financials', 'energy', 'industrials', 'private-equity',
];


const HEATMAP_SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Energy & Utilities',
  'Consumer Goods', 'Industrials', 'Real Estate', 'Media & Telecom',
  'Pharma & Biotech', 'Transport & Logistics', 'Defence & Aerospace', 'Private Equity',
];

const today = new Date().toISOString().split('T')[0];
const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Alpha Vantage time format: "20240315T120000" → "2024-03-15"
function parseAVDate(timePublished: string): string {
  return `${timePublished.slice(0, 4)}-${timePublished.slice(4, 6)}-${timePublished.slice(6, 8)}`;
}

function sectorLabelToId(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('tech') || l.includes('software') || l.includes('ai') || l.includes('cloud') || l.includes('semi')) return 'technology';
  if (l.includes('health') || l.includes('pharma') || l.includes('biotech') || l.includes('medtech') || l.includes('life science')) return 'healthcare';
  if (l.includes('financial') || l.includes('finance') || l.includes('banking') || l.includes('fintech') || l.includes('insurance') || l.includes('payment')) return 'financials';
  if (l.includes('energy') || l.includes('oil') || l.includes('gas') || l.includes('utility') || l.includes('utilities') || l.includes('renewable') || l.includes('mining')) return 'energy';
  if (l.includes('industrial') || l.includes('manufactur') || l.includes('aerospace') || l.includes('defence') || l.includes('defense') || l.includes('logistics') || l.includes('transport')) return 'industrials';
  if (l.includes('private equity') || l.includes('buyout') || l.includes('pe ') || l.includes('lbo') || l.includes('take-private')) return 'private-equity';
  return null;
}

async function fetchAlphaVantageNews(): Promise<any[]> {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=mergers_and_acquisitions&limit=50&sort=LATEST&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();
  if (!data.feed || !Array.isArray(data.feed)) {
    console.error('[cron] Alpha Vantage error:', JSON.stringify(data).slice(0, 200));
    return [];
  }
  return data.feed.filter((a: any) => {
    const date = parseAVDate(a.time_published);
    return date >= cutoff && date <= today;
  });
}

async function structureArticlesWithGroq(articles: any[]): Promise<any[]> {
  if (articles.length === 0) return [];

  const articleList = articles.slice(0, 40).map((a, i) =>
    `${i + 1}. TITLE: ${a.title}\nSUMMARY: ${a.summary ?? ''}\nDATE: ${parseAVDate(a.time_published)}\nSOURCE: ${a.source}`
  ).join('\n\n');

  const prompt = `You are an M&A data analyst. Extract structured deal data from these real M&A news articles.

For each article that is genuinely about an M&A deal (acquisition, merger, buyout, take-private), return a JSON object.
Skip any article that is not about a specific deal (e.g. market commentary, earnings, general news).

Return ONLY a valid JSON array, no markdown:
[{
  "id": "kebab-slug-from-title",
  "title": "Reformatted as '[Acquirer] acquires [Target]' or keep original if unclear",
  "acquirer": "acquiring company name",
  "target": "target company name",
  "description": "1-2 sentence deal description and strategic rationale",
  "value": "deal value like '$4.2bn' or '$850m' or null if not mentioned",
  "date": "YYYY-MM-DD",
  "status": "Announced" or "Pending" or "Completed",
  "sector": "one of: Technology, Healthcare, Financial Services, Energy & Utilities, Industrials, Private Equity"
}]

Articles:
${articleList}

Return only the JSON array.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 4000,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  return parsed.filter((d: any) =>
    d?.acquirer && d?.target && d?.date && d.date >= cutoff && d.date <= today
  );
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
    if (!process.env.ALPHA_VANTAGE_API_KEY) throw new Error('ALPHA_VANTAGE_API_KEY is not set');

    // 1. Fetch real M&A news from Alpha Vantage (1 API call)
    const rawArticles = await fetchAlphaVantageNews();
    console.log(`[cron] Fetched ${rawArticles.length} real M&A articles from Alpha Vantage`);

    // 2. Use Groq to structure them into deal format
    const structuredDeals = await structureArticlesWithGroq(rawArticles);
    console.log(`[cron] Groq structured ${structuredDeals.length} deals`);

    // 3. Group by sector
    const sectorDeals: Record<string, any[]> = {};
    for (const sector of SECTORS) sectorDeals[sector] = [];

    for (const deal of structuredDeals) {
      const sectorId = sectorLabelToId(deal.sector ?? '');
      if (sectorId) sectorDeals[sectorId].push(deal);
    }

    const sectorCounts: Record<string, number> = {};
    for (const sector of SECTORS) sectorCounts[sector] = sectorDeals[sector].length;

    const allDeals = Object.values(sectorDeals).flat();
    const homepageFeed = allDeals.slice(0, 10);
    const spotlight = [...allDeals].filter(d => d.value).slice(0, 4);

    // 4. Generate heatmap data
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

    // 5. Store in KV
    await kv.set('homepage-feed', homepageFeed);
    await kv.set('spotlight', spotlight);
    await kv.set('sector-counts', sectorCounts);
    await kv.set('sector-deals', sectorDeals);
    await kv.set('heatmap-base', heatmapData);
    await kv.set('last-updated', new Date().toISOString());

    return NextResponse.json({
      success: true,
      rawArticles: rawArticles.length,
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
