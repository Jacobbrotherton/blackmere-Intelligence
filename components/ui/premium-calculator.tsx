"use client";
import { useState, useEffect } from "react";
import { Calculator, Loader2, TrendingUp } from "lucide-react";
import { PremiumGate } from "@/components/ui/premium-gate";
import { DailyLimitBanner } from "@/components/ui/DailyLimitBanner";
import { hasUsesRemaining, consumeUse, getRemainingUses } from "@/lib/daily-limits";
import { useSubscription } from "@/lib/subscription-context";

interface CalcResult {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: string;
  marketCap: string;
  peRatio: string;
  yearHigh: string;
  yearLow: string;
  sectorAvgPremium: string;
  estimatedOfferPrice: string;
  upsideFromCurrent: string;
  acquisitionLikelihood: string;
  strategicRationale: string;
  potentialAcquirers: string;
  keyRisks: string;
  comparableDeals: string;
  analystVerdict: string;
  note?: string;
}

const likelihoodColor: Record<string, string> = {
  High: "text-green-400",
  Medium: "text-amber-400",
  Low: "text-red-400",
};

export function AcquisitionPremiumCalculator() {
  const { isPremium } = useSubscription();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(1);

  useEffect(() => {
    if (!isPremium) {
      setLimitReached(!hasUsesRemaining('calculator'));
      setRemaining(getRemainingUses('calculator'));
    }
  }, [isPremium]);

  const calculate = async () => {
    if (!ticker.trim()) return;
    if (!isPremium && !hasUsesRemaining('calculator')) {
      setLimitReached(true);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/premium-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.toUpperCase() }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setResult(data as CalcResult);
        if (!isPremium) {
          consumeUse('calculator');
          setRemaining(getRemainingUses('calculator'));
          setLimitReached(!hasUsesRemaining('calculator'));
        }
      }
    } catch {
      setError("Calculation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium && limitReached) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
        <DailyLimitBanner feature="calculator" />
      </div>
    );
  }

  return (
    <PremiumGate label="Acquisition Premium Calculator — Premium Feature">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={18} className="text-indigo-400" />
          <h3 className="font-display text-xl font-bold text-white">
            Acquisition Premium Calculator
          </h3>
        </div>
        <p className="text-white/40 text-sm mb-6">
          Enter any stock ticker to see estimated acquisition value and strategic analysis
        </p>

        {!isPremium && (
          <p className="text-amber-400/70 text-xs mb-4">
            Free tier: {remaining} calculation{remaining !== 1 ? 's' : ''} remaining today
          </p>
        )}

        <div className="flex gap-3 mb-6">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && calculate()}
            placeholder="e.g. AAPL, MSFT, TSLA"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono font-semibold placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
          <button
            onClick={calculate}
            disabled={loading || !ticker.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Calculate
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">Analysis failed</p>
            <p className="text-white/50 text-xs mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Company header */}
            <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">{result.companyName}</p>
                <p className="text-white/40 text-xs">{result.ticker} · {result.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-2xl">{result.currentPrice}</p>
                <p className={`text-xs font-semibold ${likelihoodColor[result.acquisitionLikelihood] ?? "text-white/40"}`}>
                  {result.acquisitionLikelihood} likelihood
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Market Cap", value: result.marketCap },
                { label: "P/E Ratio", value: result.peRatio },
                { label: "52w High", value: result.yearHigh },
                { label: "52w Low", value: result.yearLow },
                { label: "Sector Avg Premium", value: result.sectorAvgPremium },
                { label: "Est. Offer Price", value: result.estimatedOfferPrice },
                { label: "Upside", value: result.upsideFromCurrent },
                { label: "Acq. Likelihood", value: result.acquisitionLikelihood },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-800 rounded-xl p-3">
                  <p className="text-white/40 text-xs mb-1">{stat.label}</p>
                  <p className="text-white font-bold text-sm">{stat.value ?? "N/A"}</p>
                </div>
              ))}
            </div>

            {/* Strategic Rationale */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Strategic Rationale
              </p>
              <p className="text-white/80 text-sm leading-relaxed">{result.strategicRationale}</p>
            </div>

            {/* Potential Acquirers */}
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                Potential Acquirers
              </p>
              <p className="text-white/80 text-sm">{result.potentialAcquirers}</p>
            </div>

            {/* Key Risks + Comparable Deals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Key Risks</p>
                <p className="text-white/70 text-sm leading-relaxed">{result.keyRisks}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Comparable Deals</p>
                <p className="text-white/70 text-sm leading-relaxed">{result.comparableDeals}</p>
              </div>
            </div>

            {/* Analyst Verdict */}
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                ✦ Blackmere Analyst Verdict
              </p>
              <p className="text-white text-sm font-medium leading-relaxed">{result.analystVerdict}</p>
            </div>

            {result.note && <p className="text-white/25 text-xs">{result.note}</p>}
            <p className="text-white/20 text-xs">
              ⚠ Analysis is AI-generated opinion based on publicly available data. Not financial advice.
            </p>
          </div>
        )}
      </div>
    </PremiumGate>
  );
}
