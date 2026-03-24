import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.Blackmere_KV_REST_API_URL!,
  token: process.env.Blackmere_KV_REST_API_TOKEN!,
});

export const dynamic = 'force-dynamic';

const SECTOR_MAP: Record<string, string[]> = {
  technology:       ['Technology', 'Software', 'Semiconductor', 'Internet', 'IT Services', 'Cybersecurity', 'Cloud', 'AI', 'SaaS'],
  healthcare:       ['Healthcare', 'Medical', 'Hospital', 'Biotech', 'Health', 'Pharma', 'Life Sciences'],
  financials:       ['Financial', 'Banking', 'Insurance', 'Asset Management', 'Fintech', 'Capital Markets'],
  energy:           ['Energy', 'Oil', 'Gas', 'Utilities', 'Renewable', 'Power', 'Mining', 'Resources'],
  industrials:      ['Industrial', 'Manufacturing', 'Aerospace', 'Defence', 'Engineering', 'Transport', 'Logistics'],
  'private-equity': ['Private Equity', 'Buyout', 'Investment', 'Venture Capital', 'Fund'],
};

function mapToDeals(raw: any[]) {
  return raw.map((d: any) => ({
    id: `${d.transactionDate}-${d.targetedCompanyName}`.replace(/\s+/g, '-'),
    title: `${d.acquirerCompanyName} ${d.status === 'Completed' ? 'Acquires' : 'to Acquire'} ${d.targetedCompanyName}`,
    acquirer: d.acquirerCompanyName ?? 'Unknown',
    target: d.targetedCompanyName ?? 'Unknown',
    description: `${d.acquirerCompanyName} ${d.status?.toLowerCase() ?? 'pursuing'} acquisition of ${d.targetedCompanyName}` +
      (d.targetIndustry ? ` in the ${d.targetIndustry} sector.` : '.'),
    value: d.transactionAmount
      ? `$${(Number(d.transactionAmount) / 1e9).toFixed(1)}bn`
      : null,
    source: 'FMP',
    date: d.transactionDate ?? new Date().toISOString().split('T')[0],
    status: d.status ?? 'Rumoured',
    type: d.transactionType ?? 'Acquisition',
    sector: d.targetIndustry ?? 'Technology',
    acquirerIndustry: d.acquirerIndustry ?? null,
  }));
}

export async function GET(_request: Request) {
  // Auth temporarily disabled for manual trigger — re-enable after first run
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // ONE FMP call — powers the entire site
    const res = await fetch(
      `https://financialmodelingprep.com/api/v4/mergers-latest-acquisitions?page=0&apikey=${process.env.FMP_API_KEY}`
    );
    const raw: any[] = await res.json();
    const allDeals = mapToDeals(raw);

    // --- Homepage feed: top 10 most recent deals across all sectors ---
    const homepageFeed = allDeals.slice(0, 10);

    // --- Spotlight: top 2 highest-value deals ---
    const spotlight = [...allDeals]
      .filter(d => d.value)
      .sort((a, b) => parseFloat(b.value ?? '0') - parseFloat(a.value ?? '0'))
      .slice(0, 2);

    // --- Sector wheel counts (capped at 15) ---
    const sectorCounts: Record<string, number> = {};

    // --- Sector pages: 10–15 deals per sector ---
    const sectorDeals: Record<string, any[]> = {};

    for (const [sector, keywords] of Object.entries(SECTOR_MAP)) {
      const matched = allDeals.filter(d =>
        keywords.some(kw =>
          (d.sector ?? '').toLowerCase().includes(kw.toLowerCase()) ||
          (d.acquirerIndustry ?? '').toLowerCase().includes(kw.toLowerCase())
        )
      );
      // Enforce 10–15 range
      const capped = matched.slice(0, 15);
      sectorDeals[sector] = capped;
      sectorCounts[sector] = capped.length;
    }

    // Store everything in KV
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
    console.error('Daily refresh failed:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
