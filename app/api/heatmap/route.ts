import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const kv = new Redis({
  url: process.env.Blackmere_KV_REST_API_URL!,
  token: process.env.Blackmere_KV_REST_API_TOKEN!,
});

const REGION_SCALE: Record<string, number> = { Global: 1, US: 0.48, UK: 0.18, Europe: 0.28 };
const PERIOD_SCALE: Record<string, number> = { YTD: 1, Q1: 0.30, '12M': 2.4 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const period  = searchParams.get('period')  || 'YTD';

  try {
    const raw = await kv.get<string>('heatmap-base');
    if (!raw) throw new Error('No heatmap data in KV yet — run the daily cron first');

    const base: { sector: string; deals: number; change: string }[] = JSON.parse(raw as string);

    const regionScale = REGION_SCALE[region] ?? 1;
    const periodScale = PERIOD_SCALE[period] ?? 1;

    const data = base.map(item => ({
      sector: item.sector,
      deals: Math.max(1, Math.round(item.deals * regionScale * periodScale)),
      change: item.change,
    }));

    return NextResponse.json({
      data,
      region,
      period,
      source: 'groq-kv',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Heatmap KV error:', message);
    return NextResponse.json({ error: 'Failed to load heatmap data', detail: message }, { status: 500 });
  }
}
