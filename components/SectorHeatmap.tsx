'use client';

import { useEffect, useState } from 'react';

const SECTORS = [
  'Technology','Healthcare','Financial Services',
  'Energy & Utilities','Consumer Goods','Industrials',
  'Real Estate','Media & Telecom','Pharma & Biotech',
  'Transport & Logistics','Defence & Aerospace','Private Equity',
];

const REGIONS = ['Global','UK','US','Europe'];
const PERIODS  = ['YTD','Q1','12M'];

const RAMP_BG  = ['#FCEBEB','#F7C1C1','#F09595','#E24B4A','#A32D2D','#791F1F'];
// Every text colour is now high-contrast against its background
// Light tiles  → very dark red text
// Dark tiles   → very light cream text
const RAMP_TXT = ['#5C0A0A','#5C0A0A','#5C0A0A','#FFF1E0','#FFF1E0','#FFF1E0'];
// Change indicator: always white on dark, always dark-red on light
const RAMP_CHG_UP  = ['#16A34A','#16A34A','#16A34A','#86EFAC','#86EFAC','#86EFAC'];
const RAMP_CHG_DN  = ['#991B1B','#991B1B','#B91C1C','#FCA5A5','#FCA5A5','#FCA5A5'];

const BASE: Record<string,number> = {
  'Technology':142,'Healthcare':98,'Financial Services':87,
  'Energy & Utilities':76,'Consumer Goods':64,'Industrials':61,
  'Real Estate':55,'Media & Telecom':48,'Pharma & Biotech':93,
  'Transport & Logistics':34,'Defence & Aerospace':29,'Private Equity':71,
};
const CHANGES: Record<string,string> = {
  'Technology':'+14.3%','Healthcare':'+12%','Financial Services':'+11.1%',
  'Energy & Utilities':'+25%','Consumer Goods':'+10%','Industrials':'+7.1%',
  'Real Estate':'+20%','Media & Telecom':'+13.6%','Pharma & Biotech':'+20%',
  'Transport & Logistics':'+25%','Defence & Aerospace':'+22%','Private Equity':'+11%',
};
const REGION_MULT: Record<string,number> = { Global:1, UK:0.27, US:0.48, Europe:0.31 };
const PERIOD_MULT: Record<string,number> = { YTD:1, Q1:0.31, '12M':2.24 };

function seedData(region: string, period: string) {
  const m = (REGION_MULT[region] ?? 1) * (PERIOD_MULT[period] ?? 1);
  return SECTORS.map(s => ({
    sector: s,
    deals: Math.max(1, Math.round((BASE[s] ?? 20) * m)),
    change: CHANGES[s] ?? '+0%',
  }));
}

function getColor(val: number, min: number, max: number) {
  const t = max === min ? 0 : (val - min) / (max - min);
  const i = Math.min(Math.floor(t * RAMP_BG.length), RAMP_BG.length - 1);
  return {
    bg:     RAMP_BG[i],
    text:   RAMP_TXT[i],
    chgUp:  RAMP_CHG_UP[i],
    chgDn:  RAMP_CHG_DN[i],
    barW:   Math.round(t * 100),
  };
}

export default function SectorHeatmap() {
  const [region, setRegion] = useState('Global');
  const [period, setPeriod] = useState('YTD');
  const [rows, setRows]     = useState(() => seedData('Global','YTD'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setRows(seedData(region, period));
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [region, period]);

  const vals  = rows.map(r => r.deals);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const total = vals.reduce((a,b) => a+b, 0);
  const top   = rows.reduce((a,b) => a.deals > b.deals ? a : b);
  const avg   = Math.round(total / rows.length);

  const filterBtn = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded border transition-colors ${
      active
        ? 'bg-ft-black text-white border-ft-black'
        : 'bg-transparent text-ft-muted border-ft-border hover:border-ft-black hover:text-ft-black'
    }`;

  return (
    <div className="bg-ft-cream border-t-2 border-ft-black py-10">
      <div className="max-w-screen-xl mx-auto px-6">

        {/* Header */}
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-ft-black">Sector Activity Heatmap</h2>
          <p className="text-sm text-ft-muted mt-1">Deal volume by sector — deeper red indicates higher activity</p>
        </div>

        {/* Region + Period filters */}
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
            { label: 'Total deals',       val: String(total) },
            { label: 'Hottest sector',    val: top.sector.split(' ')[0] },
            { label: 'Avg deals / sector',val: String(avg) },
          ] as {label:string;val:string}[]).map(({ label, val }) => (
            <div key={label} className="border border-ft-border rounded-lg px-5 py-4">
              <p className="text-xs text-ft-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="font-display text-2xl font-bold text-ft-black leading-none">{val}</p>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}
        >
          {rows.map(row => {
            const c   = getColor(row.deals, min, max);
            const up  = row.change.startsWith('+');
            const chg = up ? c.chgUp : c.chgDn;
            return (
              <div
                key={row.sector}
                className="rounded-lg px-4 py-3 flex flex-col justify-between min-h-[90px]"
                style={{ backgroundColor: c.bg }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: c.text }}>{row.sector}</p>
                <div>
                  <p className="font-display text-3xl font-bold leading-none" style={{ color: c.text }}>
                    {row.deals}
                  </p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: c.text }}>deals</p>
                </div>
                <p className="text-xs font-semibold mt-2" style={{ color: chg }}>
                  {up ? '▲' : '▼'} {row.change}
                </p>
                {/* Intensity bar */}
                <div className="mt-2 h-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.barW}%`, background: up ? chg : chg }}
                  />
                </div>
              </div>
            );
          })}
        </div>

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
