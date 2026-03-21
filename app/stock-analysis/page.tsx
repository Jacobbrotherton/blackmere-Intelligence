import { StockAnalysisHero } from "@/components/ui/stock-analysis-hero";
import { RumouredDealsSection } from "@/components/ui/rumoured-deals-section";
import { MaSearchBar } from "@/components/ui/ma-search-bar";
import { AcquisitionPremiumCalculator } from "@/components/ui/premium-calculator";
import { Watchlist } from "@/components/ui/watchlist";
import { PremiumUpgradeBanner } from "@/components/PremiumUpgradeBanner";

export default function StockAnalysisPage() {
  return (
    <main>
      <StockAnalysisHero />

      {/* Intelligence Suite — AI search + calculator + watchlist grouped together */}
      <section className="bg-[#030303] py-16 px-4 md:px-8 border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-10">
            <p className="text-indigo-400 text-xs uppercase tracking-widest mb-2">AI-Powered Tools</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Intelligence Suite</h2>
            <p className="text-white/30 text-sm mt-2">Powered by Groq AI · Updated in real time</p>
          </div>

          <div className="space-y-4">
            {/* AI M&A Search */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <div className="text-center mb-6">
                <p className="text-indigo-400 text-xs tracking-widest uppercase mb-2">M&amp;A Intelligence</p>
                <h3 className="text-xl font-bold text-white mb-2">Ask anything about deals</h3>
                <p className="text-white/30 text-sm">
                  Deal sizes, premiums, synergies, sector trends — analyst-grade answers instantly.
                </p>
              </div>
              <MaSearchBar />
            </div>

            {/* Calculator */}
            <AcquisitionPremiumCalculator />

            {/* Watchlist */}
            <Watchlist />
          </div>
        </div>
      </section>

      <RumouredDealsSection />

      <PremiumUpgradeBanner />
    </main>
  );
}
