"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BarChart2, AlertTriangle, Brain, ExternalLink, RefreshCw } from "lucide-react";
import type { RumouredDeal } from "@/lib/rumoured-deals";
import CompanyLogo from "@/components/ui/company-logo";

interface CompanyData {
  profile?: Record<string, unknown> | null;
  quote?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
  income?: Record<string, unknown>[] | null;
}

interface Props {
  deal: RumouredDeal;
  acquirerData: CompanyData;
  targetData: CompanyData;
}

interface AnalysisResult {
  analysis: string;
  sources: { title: string; source: string; url: string; publishedAt: string }[];
  cached: boolean;
}

// ── Render Groq markdown-like output ─────────────────────────────────────────
function AnalysisBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        const headingMatch = line.match(/^\*\*(.+?)\*\*$/);
        if (headingMatch) {
          return (
            <h3 key={i} className="text-white font-bold text-base mt-6 mb-1 tracking-wide">
              {headingMatch[1]}
            </h3>
          );
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-white/70 text-sm leading-relaxed">
            {parts.map((part, j) => {
              const match = part.match(/^\*\*(.+)\*\*$/);
              return match
                ? <strong key={j} className="text-white/90 font-semibold">{match[1]}</strong>
                : part;
            })}
          </p>
        );
      })}
    </div>
  );
}

// ── AI analysis panel (client-side fetch) ────────────────────────────────────
function AIAnalysisPanel({ deal }: { deal: RumouredDeal }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calledRef = useRef(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dealId: deal.id,
        acquirer: deal.acquirerName,
        target: deal.targetName,
        value: deal.estimatedValue,
        summary: deal.summary.slice(0, 600),
      });
      const res = await fetch(`/api/deal-analysis?${params}`);
      if (!res.ok) throw new Error(`Analysis unavailable (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    fetchAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white/[0.02] border border-indigo-500/20 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-indigo-500/[0.04]">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm">AI Deal Intelligence Report</span>
          <span className="text-xs text-white/30 ml-1">Groq · llama-3.3-70b · live sources</span>
        </div>
        {!loading && (
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-white/40 text-sm">
                Searching news sources and generating institutional analysis…
              </span>
            </div>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-white/[0.04] rounded animate-pulse" style={{ width: `${65 + (i % 4) * 8}%` }} />
                <div className="h-3 bg-white/[0.04] rounded animate-pulse w-full" />
                <div className="h-3 bg-white/[0.04] rounded animate-pulse" style={{ width: `${55 + (i % 3) * 10}%` }} />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={fetchAnalysis} className="text-xs text-indigo-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        {result && !loading && (
          <>
            <AnalysisBody text={result.analysis} />
            {result.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">
                  {result.sources.length} sources referenced
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.sources.slice(0, 8).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 group p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <ExternalLink size={11} className="text-indigo-400 mt-0.5 flex-shrink-0 group-hover:text-indigo-300" />
                      <div className="min-w-0">
                        <p className="text-white/50 text-xs leading-snug line-clamp-2 group-hover:text-white/70 transition-colors">
                          {s.title}
                        </p>
                        <p className="text-white/20 text-[10px] mt-0.5">{s.source}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-6 text-white/20 text-xs italic">
              {result.cached ? "⚡ Cached result" : "✦ Freshly generated"} · AI analysis may contain inaccuracies. Not financial advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Market data ───────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-xl">{value || "—"}</p>
    </div>
  );
}

function CompanyPanel({ data, name, ticker }: {
  data: CompanyData;
  name: string;
  ticker: string;
}) {
  const q = data.quote as Record<string, number> | null | undefined;
  const m = data.metrics as Record<string, number> | null | undefined;
  const p = data.profile as Record<string, unknown> | null | undefined;

  const fmt = (n?: number) =>
    n != null ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
  const fmtB = (n?: number) =>
    n != null ? `$${(n / 1e9).toFixed(2)}B` : "—";

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <CompanyLogo name={name} size="lg" />
        <div>
          <h3 className="text-white font-bold text-xl">{name}</h3>
          <p className="text-white/40 text-sm">
            {ticker} {typeof p?.exchange === "string" && p.exchange ? `· ${p.exchange}` : ""}
          </p>
        </div>
        {q?.price != null && (
          <div className="ml-auto text-right">
            <p className="text-white font-bold text-2xl">${fmt(q.price)}</p>
            <p className={`text-sm font-medium ${(q.changesPercentage ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {(q.changesPercentage ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(q.changesPercentage ?? 0).toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {typeof p?.description === "string" && p.description && (
        <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-3">{p.description}</p>
      )}

      {q ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Market Cap" value={fmtB(q.marketCap)} />
          <StatCard label="P/E Ratio" value={fmt(q.pe)} />
          <StatCard label="EV / EBITDA" value={fmt(m?.enterpriseValueOverEBITDA)} />
          <StatCard label="52w High" value={`$${fmt(q.yearHigh)}`} />
          <StatCard label="52w Low" value={`$${fmt(q.yearLow)}`} />
          <StatCard label="Avg Volume" value={q.avgVolume != null ? `${(q.avgVolume / 1e6).toFixed(1)}M` : "—"} />
        </div>
      ) : (
        <p className="text-white/30 text-sm italic">
          {ticker === "PRIVATE"
            ? "Private company — no public market data available."
            : "Live data loading…"}
        </p>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function DealDetailClient({ deal, acquirerData, targetData }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] py-16 px-4 md:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-rose-500/[0.04]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={16} /> Back to Stock Analysis
          </button>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-xs px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
              ⚠ {deal.status} — Unconfirmed
            </span>
            <span className="text-xs text-white/30">{deal.dealType} · {deal.sector}</span>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <CompanyLogo name={deal.acquirerName} size="lg" />
            <span className="text-white/20 text-3xl font-light">×</span>
            <CompanyLogo name={deal.targetName} size="lg" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-white">{deal.acquirerName}</span>
            <span className="text-white/20 mx-4">×</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-rose-300">
              {deal.targetName}
            </span>
          </h1>

          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">Estimated Value</p>
              <p className="text-indigo-300 text-3xl font-bold">{deal.estimatedValue}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">First Rumoured</p>
              <p className="text-white text-xl font-semibold">{deal.dateRumoured}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">Source</p>
              <p className="text-white text-xl font-semibold">{deal.source}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-16">

        {/* Deal background */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-400" /> Deal Background
          </h2>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
            <p className="text-white/70 text-lg leading-relaxed">{deal.summary}</p>
            <p className="mt-6 text-white/25 text-sm italic">
              ⚠ Unconfirmed rumour based on credible press reporting. Not investment advice.
            </p>
          </div>
        </motion.section>

        {/* AI intelligence report */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Brain size={20} className="text-indigo-400" /> AI Intelligence Report
          </h2>
          <AIAnalysisPanel deal={deal} />
        </motion.section>

        {/* Live market data */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-400" /> Live Market Data
            <span className="text-xs text-white/30 font-normal ml-2">via Financial Modeling Prep</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyPanel
              data={acquirerData}
              name={deal.acquirerName}
              ticker={deal.acquirerTicker}
            />
            <CompanyPanel
              data={targetData}
              name={deal.targetName}
              ticker={deal.targetTicker}
            />
          </div>
        </motion.section>

      </div>
    </div>
  );
}
