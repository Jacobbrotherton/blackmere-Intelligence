"use client";

import { useState, useEffect } from "react";

interface Stock {
  symbol: string;
  name: string;
  role: string;
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
}

export default function StockCards() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    fetch("/api/stocks", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFatalError(data.error);
          return;
        }
        setStocks(data.stocks ?? []);
        setCachedAt(data.cachedAt ?? null);
        setStale(data.stale ?? false);
      })
      .catch((e: Error) => {
        // Don't show fatal error on abort/timeout — we might still have stale data
        if (e.name !== "AbortError") setFatalError(e.message);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const statusLabel = loading
    ? "Loading…"
    : fatalError
    ? "Unavailable"
    : stale && cachedAt
    ? `Last known prices · cached ${formatTime(cachedAt)}`
    : cachedAt
    ? `Updated ${formatTime(cachedAt)} · refreshes every 15 min`
    : null;

  return (
    <div className="mt-8 border-t border-ft-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold tracking-widest text-ft-muted uppercase">
          Deal Participants · Live Stock Prices
        </h4>
        <span className="text-xs text-ft-muted">{statusLabel}</span>
      </div>

      {stale && stocks.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-1.5 mb-3">
          Alpha Vantage is rate-limited — showing last cached prices.
        </p>
      )}

      {fatalError && stocks.length === 0 ? (
        <p className="text-xs text-ft-red">{fatalError}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {loading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-ft-border p-3 rounded-sm animate-pulse"
                >
                  <div className="h-2.5 bg-ft-border rounded w-10 mb-2" />
                  <div className="h-5 bg-ft-border rounded w-20 mb-1" />
                  <div className="h-2.5 bg-ft-border rounded w-14 mb-2" />
                  <div className="h-2.5 bg-ft-border rounded w-24" />
                </div>
              ))
            : stocks.map((s) => (
                <div
                  key={s.symbol}
                  className={`bg-white border p-3 rounded-sm ${
                    stale ? "border-amber-200 opacity-80" : "border-ft-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-display font-bold text-sm">{s.symbol}</span>
                    <span
                      className={`text-xs font-semibold ${
                        s.up ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {s.up ? "▲" : "▼"}
                    </span>
                  </div>
                  <div className="font-display text-xl font-bold">${s.price}</div>
                  <div
                    className={`text-xs font-semibold mt-0.5 ${
                      s.up ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {s.up ? "+" : ""}
                    {s.change} ({s.up ? "+" : ""}
                    {s.changePercent}%)
                  </div>
                  <div className="text-xs text-ft-muted mt-1.5 leading-tight">{s.name}</div>
                  <div className="text-xs text-ft-muted opacity-70">{s.role}</div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
