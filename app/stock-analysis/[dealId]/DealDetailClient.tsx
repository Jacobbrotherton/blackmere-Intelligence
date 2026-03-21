"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BarChart2, AlertTriangle, Brain, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import CompanyLogo from "@/components/ui/company-logo";

interface Deal {
  id: string;
  acquirerName: string;
  acquirerTicker: string;
  targetName: string;
  targetTicker: string;
  estimatedValue: string;
  summary: string;
  source: string;
  dateRumoured: string;
  status: string;
  dealType: string;
  sector: string;
  dealProbability?: number;
}

interface CompanyStats {
  price: string;
  marketCap: string;
  peRatio: string;
  evEbitda: string;
  week52High: string;
  week52Low: string;
  description: string;
  sector: string;
  exchange: string;
}

interface Props {
  dealId: string;
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

// ── AI analysis panel ─────────────────────────────────────────────────────────
function AIAnalysisPanel({ deal }: { deal: Deal }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; source: string; url: string }[]>([]);
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
      setAnalysis(data.analysis ?? "");
      setSources(data.sources ?? []);
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
          <span className="text-xs text-white/30 ml-1">Groq · llama-3.3-70b</span>
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
              <span className="text-white/40 text-sm">Generating institutional analysis…</span>
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
            <button onClick={fetchAnalysis} className="text-xs text-indigo-400 hover:underline">Try again</button>
          </div>
        )}

        {analysis && !loading && (
          <>
            <AnalysisBody text={analysis} />
            {sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">
                  {sources.length} sources referenced
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sources.slice(0, 8).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2 group p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <ExternalLink size={11} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white/50 text-xs leading-snug line-clamp-2 group-hover:text-white/70 transition-colors">{s.title}</p>
                        <p className="text-white/20 text-[10px] mt-0.5">{s.source}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-6 text-white/20 text-xs italic">
              ✦ AI analysis may contain inaccuracies. Not financial advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Groq-powered company panel ────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-xl">{value || "—"}</p>
    </div>
  );
}

function CompanyPanel({ name, ticker }: { name: string; ticker: string }) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(ticker !== "PRIVATE");

  useEffect(() => {
    if (ticker === "PRIVATE") return;
    fetch(`/api/company-data?ticker=${ticker}&name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, name]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <CompanyLogo name={name} size="lg" />
        <div>
          <h3 className="text-white font-bold text-xl">{name}</h3>
          <p className="text-white/40 text-sm">
            {ticker}{stats?.exchange ? ` · ${stats.exchange}` : ""}
          </p>
        </div>
        {stats?.price && (
          <div className="ml-auto text-right">
            <p className="text-white font-bold text-2xl">{stats.price}</p>
            <p className="text-white/40 text-sm">{stats.sector}</p>
          </div>
        )}
      </div>

      {stats?.description && (
        <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-3">{stats.description}</p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <Loader2 size={14} className="animate-spin" /> Fetching data…
        </div>
      )}

      {!loading && ticker === "PRIVATE" && (
        <p className="text-white/30 text-sm italic">Private company — no public market data available.</p>
      )}

      {!loading && stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Market Cap" value={stats.marketCap} />
          <StatCard label="P/E Ratio" value={stats.peRatio} />
          <StatCard label="EV / EBITDA" value={stats.evEbitda} />
          <StatCard label="52w High" value={stats.week52High} />
          <StatCard label="52w Low" value={stats.week52Low} />
          <StatCard label="Sector" value={stats.sector} />
        </div>
      )}

      {!loading && !stats && ticker !== "PRIVATE" && (
        <p className="text-white/30 text-sm italic">Could not load market data.</p>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function DealDetailClient({ dealId }: Props) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Look up deal from the live Groq-generated deals cache
    fetch("/api/refresh-deals")
      .then(r => r.json())
      .then(data => {
        const found = (data.deals as Deal[])?.find((d) => d.id === dealId);
        if (found) setDeal(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [dealId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-white/40 mb-4">Deal not found.</p>
          <button onClick={() => router.back()} className="text-indigo-400 hover:underline text-sm">← Go back</button>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

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
            {deal.dealProbability && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider">Deal Probability</p>
                <p className="text-indigo-300 text-xl font-semibold">{deal.dealProbability}%</p>
              </div>
            )}
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

        {/* Company data — Groq powered */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-400" /> Market Data
            <span className="text-xs text-white/30 font-normal ml-2">⚡ Groq AI</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyPanel name={deal.acquirerName} ticker={deal.acquirerTicker} />
            <CompanyPanel name={deal.targetName} ticker={deal.targetTicker} />
          </div>
        </motion.section>

      </div>
    </div>
  );
}
