"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Zap, Shield, TrendingUp, Bell, BarChart2, Search, Eye, Crown } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";

const FEATURES = [
  { icon: Zap, text: "Unlimited AI Deal Analysis", sub: "Powered by Groq" },
  { icon: Bell, text: "Real-time Deal Alerts", sub: "Before the headlines" },
  { icon: TrendingUp, text: "Deal Probability Scores", sub: "AI-calculated confidence" },
  { icon: BarChart2, text: "Acquisition Premium Calculator", sub: "Unlimited searches" },
  { icon: Search, text: "Unlimited AI Searches", sub: "No daily caps" },
  { icon: Eye, text: "Watchlist Monitoring", sub: "Up to 20 companies" },
  { icon: Shield, text: "All 17 Rumoured Deals", sub: "Full intelligence access" },
  { icon: Crown, text: "Sector Heatmap Dashboard", sub: "Live market intelligence" },
];

const STATS = [
  { value: "17", label: "Active Rumours" },
  { value: "$2.1T", label: "Deal Value Tracked" },
  { value: "<1s", label: "AI Response Time" },
  { value: "24/7", label: "Live Intelligence" },
];

export function PremiumUpgradeBanner() {
  const router = useRouter();
  const { isPremium } = useSubscription();

  if (isPremium) return null;

  return (
    <section className="bg-[#030303] py-16 px-4 md:px-8 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/40 text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-10 md:p-16"
        >
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 mb-6">
                <Crown size={12} className="text-white/60" />
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Blackmere Premium</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Institutional intelligence.<br />
                <span className="text-white/50">Consumer price.</span>
              </h2>
              <p className="text-white/40 text-lg leading-relaxed mb-8 max-w-lg">
                Bloomberg charges £24,000/year. Blackmere Intelligence gives you AI-powered M&A deal intelligence for less than the price of a coffee per week.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div>
                  <span className="text-5xl font-bold text-white">£6.99</span>
                  <span className="text-white/40 ml-2">/month</span>
                </div>
                <div className="bg-white/[0.06] border border-white/10 rounded-full px-4 py-2">
                  <span className="text-white/60 text-sm font-semibold">Or £50/year — save £33.88</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/subscribe')}
                  className="px-8 py-4 rounded-2xl font-bold text-base bg-white text-[#030303] hover:bg-white/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Crown size={18} />
                  Start Premium Today
                </button>
                <button
                  onClick={() => router.push('/subscribe')}
                  className="px-8 py-4 rounded-2xl font-semibold text-base border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
                >
                  View all features →
                </button>
              </div>
              <p className="text-white/20 text-xs mt-4">Cancel anytime · Secure payments via Stripe · Instant access</p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon size={14} className="text-white/60" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{feature.text}</p>
                    <p className="text-white/30 text-xs">{feature.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 mt-10 text-white/20 text-xs uppercase tracking-widest"
        >
          <span>🔒 256-bit SSL Encryption</span>
          <span>↩ Cancel Anytime</span>
          <span>⚡ Groq AI — Fastest Inference Available</span>
          <span>📊 Real-time Market Intelligence</span>
        </motion.div>
      </div>
    </section>
  );
}
