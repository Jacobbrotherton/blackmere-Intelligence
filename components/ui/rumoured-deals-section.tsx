"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { rumouredDeals } from "@/lib/rumoured-deals";
import { TrendingUp, AlertCircle, Clock } from "lucide-react";
import CompanyLogo from "@/components/ui/company-logo";

const statusConfig = {
  "Rumour":          { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: AlertCircle },
  "Talks Confirmed": { color: "text-green-400 bg-green-400/10 border-green-400/20", icon: TrendingUp },
  "Under Review":    { color: "text-blue-400  bg-blue-400/10  border-blue-400/20",  icon: Clock },
};

export function RumouredDealsSection() {
  const router = useRouter();

  return (
    <section className="bg-[#030303] py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-indigo-400 text-sm tracking-widest uppercase mb-4"
          >
            Unconfirmed Intelligence
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Rumoured Deals
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/40 max-w-xl mx-auto"
          >
            These transactions have not been officially announced. All information is based on
            market intelligence, analyst speculation, and credible financial press reports.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rumouredDeals.map((deal, i) => {
            const StatusIcon = statusConfig[deal.status].icon;
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => router.push(`/stock-analysis/${deal.id}`)}
                className="group cursor-pointer bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6
                  hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300
                  hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${statusConfig[deal.status].color}`}>
                    <StatusIcon size={11} />
                    {deal.status}
                  </span>
                  <span className="text-xs text-white/30">{deal.dateRumoured}</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <CompanyLogo name={deal.acquirerName} size="md" />
                  <div className="flex-1 text-white/40 text-xl font-light text-center">→</div>
                  <CompanyLogo name={deal.targetName} size="md" />
                  <div className="ml-auto text-right">
                    <p className="text-indigo-300 font-bold text-lg">{deal.estimatedValue}</p>
                    <p className="text-white/30 text-xs">{deal.dealType}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-white font-semibold text-base">
                    {deal.acquirerName} <span className="text-white/40">→</span> {deal.targetName}
                  </p>
                  <p className="text-white/30 text-xs mt-1">{deal.sector}</p>
                </div>

                <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-4">
                  {deal.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <span className="text-white/25 text-xs">{deal.source}</span>
                  <span className="text-indigo-400 text-xs group-hover:text-indigo-300 transition-colors">
                    Deep dive →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-white/20 text-xs mt-12 max-w-2xl mx-auto">
          ⚠ Disclaimer: All deals listed are unconfirmed rumours based on publicly available
          market speculation and financial press reports. This is not financial advice.
          Always conduct your own due diligence.
        </p>
      </div>
    </section>
  );
}
