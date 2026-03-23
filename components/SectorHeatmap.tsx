"use client";

import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SectorStat {
  sector: string;
  current: number;
  prior: number;
}

// ── Sector bucketing ──────────────────────────────────────────────────────────
const SECTOR_BUCKETS: { label: string; keywords: string[] }[] = [
  { label: "Technology",           keywords: ["tech", "software", "semiconductor", "cloud", "cyber", "it ", "information technology", "saas", "internet", "hardware", "telecom", "communication"] },
  { label: "Healthcare",           keywords: ["health", "hospital", "medical", "clinic", "care"] },
  { label: "Financial Services",   keywords: ["bank", "financ", "insurance", "invest", "asset management", "capital", "fund", "fintech", "payment", "wealth"] },
  { label: "Energy & Utilities",   keywords: ["energy", "oil", "gas", "utility", "utilities", "power", "electric", "solar", "wind", "renewable", "mining", "coal", "lng"] },
  { label: "Consumer Goods",       keywords: ["consumer", "retail", "food", "beverage", "apparel", "fashion", "luxury", "household", "grocery"] },
  { label: "Industrials",          keywords: ["industrial", "manufactur", "engineer", "chemical", "material", "construction", "machinery", "equipment"] },
  { label: "Real Estate",          keywords: ["real estate", "reit", "property", "housing", "realty", "mortgage"] },
  { label: "Media & Telecom",      keywords: ["media", "entertainment", "broadcast", "publish", "gaming", "streaming", "telecom", "wireless", "mobile network"] },
  { label: "Pharma & Biotech",     keywords: ["pharma", "biotech", "drug", "therapeut", "genomic", "life science", "vaccine", "biolog"] },
  { label: "Transport & Logistics",keywords: ["transport", "logistic", "shipping", "freight", "airline", "aviation", "rail", "truck", "fleet", "delivery", "cargo"] },
  { label: "Defence & Aerospace",  keywords: ["defence", "defense", "aerospace", "military", "weapon", "security", "government"] },
];

function classifyIndustry(industry: string | null | undefined): string {
  if (!industry) return "Other";
  const lower = industry.toLowerCase();
  for (const bucket of SECTOR_BUCKETS) {
    if (bucket.keywords.some((kw) => lower.includes(kw))) return bucket.label;
  }
  return "Other";
}

// ── Colour ramp (lightest → darkest) ─────────────────────────────────────────
const RAMP = ["#FCEBEB", "#F7C1C1", "#F09595", "#E24B4A", "#A32D2D", "#791F1F"];
const TEXT_LIGHT = "#501313";
const TEXT_DARK  = "#FCEBEB";

function getRampIndex(rank: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(RAMP.length - 1, Math.floor((rank / (total - 1)) * (RAMP.length - 1)));
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-ft-cream py-10 border-t-2 border-ft-black">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="h-7 w-64 bg-ft-border rounded animate-pulse mb-2" />
        <div className="h-4 w-40 bg-ft-border rounded animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-ft-border rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-24 bg-ft-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SectorHeatmap() {
  const [sectors, setSectors] = useState<SectorStat[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
      if (!key) return;

      // Fetch latest ~200 M&A deals
      const res = await fetch(
        `https://financialmodelingprep.com/api/v4/mergers-latest-acquisitions?page=0&apikey=${key}`
      );
      if (!res.ok) return;
      const deals: { targetedIndustry?: string; transactionDate?: string }[] = await res.json();
      if (!Array.isArray(deals) || deals.length === 0) return;

      // Split into current (first half) and prior (second half) periods
      const mid = Math.floor(deals.length / 2);
      const currentDeals = deals.slice(0, mid);
      const priorDeals   = deals.slice(mid);

      const count = (arr: typeof deals) => {
        const map: Record<string, number> = {};
        for (const d of arr) {
          const label = classifyIndustry(d.targetedIndustry);
          map[label] = (map[label] ?? 0) + 1;
        }
        return map;
      };

      const currentMap = count(currentDeals);
      const priorMap   = count(priorDeals);

      const stats: SectorStat[] = SECTOR_BUCKETS.map(({ label }) => ({
        sector:  label,
        current: currentMap[label] ?? 0,
        prior:   priorMap[label]   ?? 0,
      }));

      setSectors(stats);
    } catch {
      // fail silently — page still renders without heatmap data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Skeleton />;

  // Sort sectors by deal count for colour ranking
  const sorted = [...sectors].sort((a, b) => b.current - a.current);
  const rankMap: Record<string, number> = {};
  sorted.forEach((s, i) => { rankMap[s.sector] = i; });

  const totalDeals    = sectors.reduce((s, x) => s + x.current, 0);
  const hottestSector = sorted[0]?.sector ?? "—";
  const avgDeals      = sectors.length ? (totalDeals / sectors.length).toFixed(1) : "0";

  return (
    <div className="bg-ft-cream py-10 border-t-2 border-ft-black">
      <div className="max-w-screen-xl mx-auto px-6">

        {/* Heading */}
        <h2 className="font-display text-2xl font-bold text-ft-black">
          Sector Activity Heatmap
        </h2>
        <p className="text-sm text-ft-muted mt-1 mb-8">
          Live deal intensity by sector — refreshes every 5 minutes
        </p>

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Deals",       value: totalDeals },
            { label: "Hottest Sector",    value: hottestSector },
            { label: "Avg Deals / Sector",value: avgDeals },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-ft-cream border border-ft-border rounded-lg px-5 py-4"
            >
              <p className="text-xs text-ft-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="font-display text-2xl font-bold text-ft-black leading-none">{value}</p>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {sectors.map((s) => {
            const rank       = rankMap[s.sector] ?? 0;
            const colorIdx   = getRampIndex(sorted.length - 1 - rank, sorted.length);
            const bg         = RAMP[colorIdx];
            const textColor  = colorIdx <= 2 ? TEXT_LIGHT : TEXT_DARK;
            const pctChange  = s.prior === 0
              ? null
              : (((s.current - s.prior) / s.prior) * 100).toFixed(1);

            return (
              <div
                key={s.sector}
                className="rounded-lg px-4 py-3 flex flex-col justify-between min-h-[90px]"
                style={{ backgroundColor: bg }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide leading-tight"
                  style={{ color: textColor }}
                >
                  {s.sector}
                </p>
                <div>
                  <p className="text-3xl font-bold leading-none mt-1" style={{ color: textColor }}>
                    {s.current}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.7 }}>
                    deals
                    {pctChange !== null && (
                      <span
                        className="ml-2 font-semibold"
                        style={{ color: parseFloat(pctChange) >= 0 ? "#16a34a" : "#dc2626" }}
                      >
                        {parseFloat(pctChange) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(pctChange))}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ft-muted whitespace-nowrap">Fewer deals</span>
          <div className="flex flex-1 max-w-xs rounded overflow-hidden h-3">
            {RAMP.map((colour) => (
              <div key={colour} className="flex-1" style={{ backgroundColor: colour }} />
            ))}
          </div>
          <span className="text-xs text-ft-muted whitespace-nowrap">More deals</span>
        </div>

      </div>
    </div>
  );
}
