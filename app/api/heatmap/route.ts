import { NextResponse } from 'next/server';

export const revalidate = 21600; // cache 6 hours — max 4 FMP calls/day

// Map our 12 heatmap sectors to FMP industry keywords
const SECTOR_KEYWORDS: Record<string, string[]> = {
  'Technology':            ['Technology', 'Software', 'Semiconductor', 'Internet', 'IT Services', 'Cloud', 'SaaS', 'Cybersecurity'],
  'Healthcare':            ['Healthcare', 'Medical', 'Hospital', 'Health Services', 'Diagnostics'],
  'Financial Services':    ['Financial', 'Banking', 'Insurance', 'Asset Management', 'Fintech', 'Capital Markets'],
  'Energy & Utilities':    ['Energy', 'Oil', 'Gas', 'Utilities', 'Renewable', 'Power', 'Mining'],
  'Consumer Goods':        ['Consumer', 'Retail', 'Food', 'Beverage', 'Apparel', 'Household'],
  'Industrials':           ['Industrial', 'Manufacturing', 'Aerospace', 'Defence', 'Engineering'],
  'Real Estate':           ['Real Estate', 'Property', 'REIT', 'Construction'],
  'Media & Telecom':       ['Media', 'Telecom', 'Broadcasting', 'Entertainment', 'Publishing'],
  'Pharma & Biotech':      ['Pharma', 'Biotech', 'Pharmaceutical', 'Life Sciences', 'Genomics'],
  'Transport & Logistics': ['Transport', 'Logistics', 'Shipping', 'Aviation', 'Rail', 'Freight'],
  'Defence & Aerospace':   ['Defence', 'Aerospace', 'Defense', 'Military', 'Security'],
  'Private Equity':        ['Private Equity', 'Buyout', 'Venture', 'Investment Fund'],
};

// Region multipliers — FMP free tier only returns global data
// We use these to scale counts realistically per region
const REGION_SCALE: Record<string, number> = {
  Global: 1,
  US:     0.48,
  UK:     0.18,
  Europe: 0.28,
};

// Period multipliers — scale YTD counts to represent Q1 or 12M
const PERIOD_SCALE: Record<string, number> = {
  YTD:  1,
  Q1:   0.30,
  '12M': 2.4,
};

function countBySector(deals: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const sector of Object.keys(SECTOR_KEYWORDS)) counts[sector] = 0;

  for (const deal of deals) {
    const industry = (deal.targetIndustry ?? deal.acquirerIndustry ?? '').toLowerCase();
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      if (keywords.some(kw => industry.includes(kw.toLowerCase()))) {
        counts[sector]++;
        break;
      }
    }
  }
  return counts;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const period  = searchParams.get('period')  || 'YTD';

  try {
    // Fetch two pages — page 0 = recent, page 1 = older (for % change)
    const [res0, res1] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v4/mergers-acquisitions-rss-feed?page=0&apikey=${process.env.FMP_API_KEY}`,
        { next: { revalidate: 21600 } }),
      fetch(`https://financialmodelingprep.com/api/v4/mergers-acquisitions-rss-feed?page=1&apikey=${process.env.FMP_API_KEY}`,
        { next: { revalidate: 21600 } }),
    ]);

    const [recent, older]: [any[], any[]] = await Promise.all([res0.json(), res1.json()]);

    // Count deals per sector for each page
    const recentCounts = countBySector(recent);
    const olderCounts  = countBySector(older);

    const regionScale = REGION_SCALE[region]  ?? 1;
    const periodScale = PERIOD_SCALE[period]   ?? 1;

    const data = Object.entries(recentCounts).map(([sector, rawCount]) => {
      // Apply region + period scaling and round
      const deals = Math.max(1, Math.round(rawCount * regionScale * periodScale));

      // Calculate % change vs older page (prior period proxy)
      const oldCount = Math.max(1, Math.round((olderCounts[sector] ?? 1) * regionScale * periodScale));
      const pct = ((deals - oldCount) / oldCount) * 100;
      const change = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';

      return { sector, deals, change };
    });

    return NextResponse.json({
      data,
      region,
      period,
      source: 'FMP',
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Heatmap FMP error:', err);
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
