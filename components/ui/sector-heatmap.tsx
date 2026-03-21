"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PremiumGate } from "@/components/ui/premium-gate";

interface SectorData {
  sector: string;
  dealCount: number;
  avgPremium: string;
  momentum: "hot" | "warm" | "cool";
  trend: string;
}

export function SectorHeatmap() {
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sector-heatmap")
      .then(r => r.json())
      .then(d => { setData(d.sectors ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const heatColors: Record<string, string> = {
    hot: "bg-rose-500/20 border-rose-500/30 text-rose-400",
    warm: "bg-amber-500/20 border-amber-500/30 text-amber-400",
    cool: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  };

  return (
    <PremiumGate label="Sector Heatmap — Premium Feature">
      <div className="bg-white border border-ft-border rounded-2xl p-6">
        <h3 className="font-display text-xl font-bold text-ft-black mb-1">Sector Heatmap</h3>
        <p className="text-ft-black/40 text-sm mb-6">AI-analysed M&A activity by sector — updated every 6 hours</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.map((sector, i) => (
              <motion.div
                key={sector.sector}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-xl p-3 ${heatColors[sector.momentum] ?? heatColors.cool}`}
                title={sector.trend}
              >
                <p className="font-semibold text-sm mb-1">{sector.sector}</p>
                <p className="text-2xl font-bold">{sector.dealCount}</p>
                <p className="text-xs opacity-70">deals tracked</p>
                <p className="text-xs mt-1 opacity-70">{sector.avgPremium} avg premium</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PremiumGate>
  );
}
