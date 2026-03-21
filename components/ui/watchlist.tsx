"use client";
import { useState, useEffect } from "react";
import { Plus, X, Eye, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { PremiumGate } from "@/components/ui/premium-gate";

const MAX_WATCHLIST = 20;

interface Quote {
  symbol: string;
  name?: string;
  price: number | null;
  changesPercentage: number | null;
  marketCap?: number | null;
  notFound?: boolean;
  fetchError?: string;
}

export function Watchlist() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});

  const fetchQuote = async (ticker: string) => {
    try {
      const res = await fetch(`/api/watchlist-quote?ticker=${ticker}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuotes(prev => ({ ...prev, [ticker]: data ?? { symbol: ticker, price: null } }));
    } catch {
      setQuotes(prev => ({
        ...prev,
        [ticker]: { symbol: ticker, price: null, changesPercentage: null, fetchError: "Failed to load" },
      }));
    }
  };

  // Load saved tickers from localStorage and immediately fetch quotes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("blackmere_watchlist");
      if (saved) {
        const saved_tickers: string[] = JSON.parse(saved);
        setTickers(saved_tickers);
        saved_tickers.forEach(fetchQuote);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTicker = () => {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= MAX_WATCHLIST) return;
    const updated = [...tickers, t];
    setTickers(updated);
    try { localStorage.setItem("blackmere_watchlist", JSON.stringify(updated)); } catch {}
    fetchQuote(t);
    setInput("");
  };

  const removeTicker = (t: string) => {
    const updated = tickers.filter(x => x !== t);
    setTickers(updated);
    setQuotes(prev => { const next = { ...prev }; delete next[t]; return next; });
    try { localStorage.setItem("blackmere_watchlist", JSON.stringify(updated)); } catch {}
  };

  return (
    <PremiumGate label="Watchlist — Premium Feature">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <Eye size={18} className="text-indigo-400" />
          <h3 className="font-display text-xl font-bold text-white">My Watchlist</h3>
          <span className="ml-auto text-white/30 text-sm">{tickers.length}/{MAX_WATCHLIST}</span>
        </div>
        <p className="text-white/40 text-sm mb-5">
          Monitor companies for M&A activity. AI alerts when rumours surface.
        </p>

        <div className="flex gap-2 mb-5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addTicker()}
            placeholder="Add ticker (e.g. AAPL)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={addTicker}
            disabled={tickers.length >= MAX_WATCHLIST}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {tickers.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
            <Eye size={24} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Add tickers to start monitoring for M&A activity</p>
            <p className="text-white/20 text-xs mt-1">Up to {MAX_WATCHLIST} companies</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickers.map((ticker) => {
              const q = quotes[ticker];
              const isLoading = q === undefined;
              const hasPrice = q !== null && q !== undefined && typeof q.price === "number" && q.price !== null;
              const isUp = hasPrice && (q!.changesPercentage ?? 0) >= 0;

              return (
                <div
                  key={ticker}
                  className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl border border-zinc-700"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono font-bold text-white text-sm">{ticker}</span>
                    {!isLoading && q?.name && q.name !== ticker && (
                      <span className="text-white/30 text-xs truncate max-w-[110px]">{q.name}</span>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin text-white/30" />
                    ) : hasPrice ? (
                      <>
                        <span className="text-white font-semibold text-sm">
                          ${q!.price!.toFixed(2)}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${isUp ? "text-green-400" : "text-red-400"}`}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {Math.abs(q!.changesPercentage ?? 0).toFixed(2)}%
                        </span>
                      </>
                    ) : q?.notFound ? (
                      <span className="text-white/30 text-xs">Ticker not found</span>
                    ) : (
                      <span className="text-white/30 text-xs">Price unavailable</span>
                    )}

                    <button
                      onClick={() => removeTicker(ticker)}
                      className="text-white/20 hover:text-red-400 transition-colors ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <span className="text-xs text-white/20">⚡ Powered by Groq AI</span>
        </div>
      </div>
    </PremiumGate>
  );
}
