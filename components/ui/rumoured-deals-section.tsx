"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/ui/company-logo";
import { rumouredDeals, type RumouredDeal } from "@/lib/rumoured-deals";

export function RumouredDealsSection() {
  const router = useRouter();

  return (
    <section className="bg-[#030303] py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm tracking-widest uppercase mb-4">M&amp;A Intelligence</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Rumoured Deals</h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            Curated intelligence on active M&amp;A rumours, confirmed talks, and deals under regulatory review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rumouredDeals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              onClick={() => router.push(`/stock-analysis/${deal.id}`)}
            />
          ))}
        </div>

        <p className="text-center text-white/20 text-xs mt-12 max-w-2xl mx-auto">
          ⚠ Disclaimer: All deals are unconfirmed rumours based on publicly available market speculation. Not financial advice.
        </p>
      </div>
    </section>
  );
}

function DealCard({ deal, index, onClick }: { deal: RumouredDeal; index: number; onClick: () => void }) {
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
