"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, RefreshCw } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";
import CompanyLogo from "@/components/ui/company-logo";

interface Deal {
  id: string;
  acquirerName: string;
  acquirerTicker: string;
  acquirerLogo: string;
  targetName: string;
  targetTicker: string;
  targetLogo: string;
  dealType: string;
  estimatedValue: string;
  estimatedValueNum: number;
  summary: string;
  source: string;
  dateRumoured: string;
  status: string;
  sector: string;
  dealProbability: number;
  probabilityRationale: string;
  keyStats: {
    acquirerMarketCap: string;
    targetMarketCap: string;
    estimatedPremium: string;
    sectorAvgMultiple: string;
  };
}

export function RumouredDealsSection() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeals = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/refresh-deals");
      const data = await res.json();
      setDeals(data.deals ?? []);
      setLastRefreshed(data.lastRefreshed ?? "");
    } catch (err) {
      console.error("Failed to load deals:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDeals(); }, []);

  const visibleDeals = isPremium ? deals : deals.slice(0, 2);
  const lockedDeals = isPremium ? [] : deals.slice(2);

  if (loading) {
    return (
      <section className="bg-[#030303] py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-indigo-400 text-sm tracking-widest uppercase">Live AI Intelligence</p>
              <RefreshCw size={14} className="animate-spin text-white/30" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Rumoured Deals</h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm">Groq AI is researching live M&amp;A intelligence...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 animate-pulse">
                <div className="flex justify-between items-start mb-5">
                  <div className="h-6 w-24 bg-zinc-700 rounded-full" />
                  <div className="h-4 w-16 bg-zinc-700 rounded" />
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-700" />
                  <div className="w-6 h-4 bg-zinc-700 rounded" />
                  <div className="w-12 h-12 rounded-xl bg-zinc-700" />
                  <div className="ml-auto">
                    <div className="h-6 w-20 bg-zinc-700 rounded mb-1" />
                    <div className="h-3 w-14 bg-zinc-700 rounded" />
                  </div>
                </div>
                <div className="h-4 w-3/4 bg-zinc-700 rounded mb-2" />
                <div className="h-3 w-1/3 bg-zinc-700 rounded mb-4" />
                <div className="mb-4">
                  <div className="h-1.5 w-full bg-zinc-700 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-zinc-700 rounded" />
                  <div className="h-3 w-5/6 bg-zinc-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#030303] py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <p className="text-indigo-400 text-sm tracking-widest uppercase">Live AI Intelligence</p>
            {lastRefreshed && (
              <span className="text-white/20 text-xs">
                Updated {new Date(lastRefreshed).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchDeals}
              disabled={refreshing}
              className="text-white/30 hover:text-white/60 transition-colors"
              title="Refresh deals"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Rumoured Deals</h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            AI-researched intelligence refreshed every 6 hours.
            {!isPremium && <span className="text-amber-400"> Free users see 2 of 17 deals.</span>}
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <RefreshCw size={28} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base font-semibold mb-2">No deals available right now</p>
            <p className="text-white/20 text-sm mb-6">Our AI is scanning for new M&amp;A intelligence. Check back shortly.</p>
            <button
              onClick={fetchDeals}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDeals.map((deal, i) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={i}
                onClick={() => router.push(`/stock-analysis/${deal.id}`)}
              />
            ))}
            {lockedDeals.map((deal, i) => (
              <LockedDealCard
                key={deal.id}
                deal={deal}
                index={visibleDeals.length + i}
                onClick={() => router.push("/subscribe")}
              />
            ))}
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-12 max-w-2xl mx-auto">
          ⚠ Disclaimer: All deals are unconfirmed rumours based on AI research of publicly available market speculation. Not financial advice.
        </p>
      </div>
    </section>
  );
}

function DealCard({ deal, index, onClick }: { deal: Deal; index: number; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    "Rumour": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    "Talks Confirmed": "text-green-400 bg-green-400/10 border-green-400/20",
    "Under Review": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className="group cursor-pointer bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-zinc-800 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="flex justify-between items-start mb-5">
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${statusColors[deal.status] ?? statusColors["Rumour"]}`}>
          {deal.status}
        </span>
        <span className="text-xs text-white/30">{deal.dateRumoured}</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <CompanyLogo name={deal.acquirerName} size="md" />
        <span className="text-white/30 text-xl">→</span>
        <CompanyLogo name={deal.targetName} size="md" />
        <div className="ml-auto text-right">
          <p className="text-indigo-300 font-bold text-lg">{deal.estimatedValue}</p>
          <p className="text-white/30 text-xs">{deal.dealType}</p>
        </div>
      </div>

      <p className="text-white font-semibold mb-1">
        {deal.acquirerName} <span className="text-white/30">→</span> {deal.targetName}
      </p>
      <p className="text-white/30 text-xs mb-3">{deal.sector}</p>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white/40 text-xs">Deal Probability</span>
          <span className="text-indigo-300 font-bold text-sm">{deal.dealProbability}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${deal.dealProbability}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-rose-400"
          />
        </div>
      </div>

      <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">{deal.summary}</p>

      <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
        <span className="text-white/25 text-xs">{deal.source}</span>
        <span className="text-indigo-400 text-xs group-hover:text-indigo-300 transition-colors">Deep dive →</span>
      </div>
    </motion.div>
  );
}

function LockedDealCard({ deal, index, onClick }: { deal: Deal; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={onClick}
      className="group cursor-pointer relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 overflow-hidden"
    >
      <div className="blur-sm opacity-40 pointer-events-none select-none">
        <div className="flex justify-between items-start mb-5">
          <span className="inline-flex text-xs px-3 py-1 rounded-full border font-medium text-amber-400 bg-amber-400/10 border-amber-400/20">Rumour</span>
          <span className="text-xs text-white/30">2026-03</span>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10" />
          <span className="text-white/30 text-xl">→</span>
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10" />
          <div className="ml-auto text-right">
            <p className="text-indigo-300 font-bold text-lg">{deal.estimatedValue}</p>
            <p className="text-white/30 text-xs">{deal.dealType}</p>
          </div>
        </div>
        <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
        <div className="h-3 bg-white/10 rounded mb-4 w-full" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-zinc-900/90 rounded-2xl px-6 py-4 text-center border border-amber-500/20">
          <Lock size={20} className="text-amber-400 mx-auto mb-2" />
          <p className="text-white font-semibold text-sm">Premium Deal</p>
          <p className="text-amber-400 text-xs mt-1">Upgrade to unlock →</p>
        </div>
      </div>
    </motion.div>
  );
}
