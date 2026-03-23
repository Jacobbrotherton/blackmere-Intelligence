'use client';

import { useEffect, useState, useCallback } from 'react';

const REGIONS = ['Global', 'UK', 'US', 'Europe'];
const PERIODS  = ['YTD', 'Q1', '12M'];

const RAMP_BG  = ['#FCEBEB','#F7C1C1','#F09595','#E24B4A','#A32D2D','#791F1F'];
const RAMP_TXT = ['#5C0A0A','#5C0A0A','#5C0A0A','#FFF1E0','#FFF1E0','#FFF1E0'];
const RAMP_CHG_UP = ['#15803D','#15803D','#15803D','#86EFAC','#86EFAC','#86EFAC'];
const RAMP_CHG_DN = ['#991B1B','#991B1B','#B91C1C','#FCA5A5','#FCA5A5','#FCA5A5'];

interface Row { sector: string; deals: number; change: string; }

function getColor(val: number, min: number, max: number) {
  const t = max === min ? 0 : (val - min) / (max - min);
  const i = Math.min(Math.floor(t * RAMP_BG.length), RAMP_BG.length - 1);
  return {
    bg:    RAMP_BG[i],
    text:  RAMP_TXT[i],
    chgUp: RAMP_CHG_UP[i],
    chgDn: RAMP_CHG_DN[i],
    barW:  Math.round(t * 100),
  };
}

export default function SectorHeatmap() {
  const [region, setRegion]     = useState('Global');
  const [period, setPeriod]     = useState('YTD');
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const fetchData = useCallback(async (r: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/heatmap?region=${r}&period=${p}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRows(json.data);
      setFetchedAt(json.fetchedAt);
    } catch (e) {
      setError('Failed to load heatmap data. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData(region, period);
  }, [region, period, fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchData(region, period), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region, period, fetchData]);

  const vals  = rows.map(r => r.deals);
  const min   = rows.length ? Math.min(...vals) : 0;
  const max   = rows.length ? Math.max(...vals) : 1;
  const total = vals.reduce((a, b) => a + b, 0);
  const top   = rows.length ? rows.reduce((a, b) => (a.deals > b.deals ? a : b)) : null;
  const avg   = rows.length ? Math.round(total / rows.length) : 0;

  const filterBtn = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded border transition-colors ${
      active
        ? 'bg-ft-black text-white border-ft-black'
        : 'bg-transparent text-ft-muted border-ft-border hover:border-ft-black hover:text-ft-black'
    }`;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="bg-ft-cream border-t-2 border-ft-black py-10">
      <div className="max-w-screen-xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-ft-black">Sector Activity Heatmap</h2>
            <p className="text-sm text-ft-muted mt-1">
              AI-estimated deal volume · % change vs prior year · deeper red = higher activity
            </p>
          </div>
          <div className="text-right">
            {fetchedAt && (
              <p className="text-xs text-ft-muted">Updated {formatTime(fetchedAt)}</p>
            )}
            <button
              onClick={() => fetchData(region, period)}
              className="text-xs text-ft-muted underline underline-offset-2 hover:text-ft-black mt-1"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-ft-muted font-medium uppercase tracking-wide mr-1">Region</span>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)} className={filterBtn(region === r)}>{r}</button>
          ))}
          <span className="text-xs text-ft-muted font-medium uppercase tracking-wide ml-4 mr-1">Period</span>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={filterBtn(period === p)}>{p}</button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {([
            { label: 'Total deals',        val: loading ? '—' : String(total) },
            { label: 'Hottest sector',     val: loading ? '—' : (top?.sector.split(' ')[0] ?? '—') },
            { label: 'Avg deals / sector', val: loading ? '—' : String(avg) },
          ] as { label: string; val: string }[]).map(({ label, val }) => (
            <div key={label} className="border border-ft-border rounded-lg px-5 py-4">
              <p className="text-xs text-ft-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="font-display text-2xl font-bold text-ft-black leading-none">{val}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-600 border border-red-200 bg-red-50 rounded px-4 py-2">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading && rows.length === 0 ? (
          // Skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg px-4 py-3 min-h-[100px] bg-[#F7C1C1] animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6 transition-opacity duration-300 ${
              loading ? 'opacity-50' : 'opacity-100'
            }`}
          >
            {rows.map(row => {
              const c   = getColor(row.deals, min, max);
              const up  = row.change.startsWith('+');
              const chg = up ? c.chgUp : c.chgDn;
              return (
                <div
                  key={row.sector}
                  className="rounded-lg px-4 py-3 flex flex-col justify-between min-h-[100px]"
                  style={{ backgroundColor: c.bg }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: c.text }}>
                    {row.sector}
                  </p>
                  <div>
                    <p className="font-display text-3xl font-bold leading-none" style={{ color: c.text }}>
                      {row.deals}
                    </p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: c.text }}>deals</p>
                  </div>
                  <p className="text-xs font-bold mt-2" style={{ color: chg }}>
                    {up ? '▲' : '▼'} {row.change} vs prior year
                  </p>
                  <div className="mt-2 h-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.barW}%`, backgroundColor: chg }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ft-muted">Fewer deals</span>
          <div className="flex gap-1">
            {RAMP_BG.map(col => (
              <div key={col} style={{ backgroundColor: col }} className="w-5 h-3 rounded-sm" />
            ))}
          </div>
          <span className="text-xs text-ft-muted">More deals</span>
        </div>

      </div>
    </div>
  );
}
