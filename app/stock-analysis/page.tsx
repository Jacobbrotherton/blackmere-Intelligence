import { StockAnalysisHero } from "@/components/ui/stock-analysis-hero";
import { RumouredDealsSection } from "@/components/ui/rumoured-deals-section";
import { MaSearchBar } from "@/components/ui/ma-search-bar";

export default function StockAnalysisPage() {
  return (
    <main>
      <StockAnalysisHero />

      {/* AI search section */}
      <section className="bg-[#030303] py-20 px-4 md:px-8 border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <p className="text-indigo-400 text-xs tracking-widest uppercase mb-3">M&amp;A Intelligence</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ask anything about deals</h2>
          <p className="text-white/30 text-sm">
            Deal sizes, premiums, synergies, sector trends — ask and get an analyst-grade answer instantly.
          </p>
        </div>
        <MaSearchBar />
      </section>

      <RumouredDealsSection />
    </main>
  );
}
