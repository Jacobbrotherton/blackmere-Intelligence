export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { fetchMaNews, SECTOR_MAP } from "@/lib/news";
import TickerBar from "@/components/TickerBar";
import LeadStories from "@/components/LeadStories";
import SectorOrbit from "@/components/SectorOrbit";
import NewsSection from "@/components/NewsSection";
import DealSpotlight from "@/components/DealSpotlight";
import ArticleDrawer from "@/components/ArticleDrawer";
import BriefingPrefetcher from "@/components/BriefingPrefetcher";
import LandmarkDeals from "@/components/LandmarkDeals";
import { PremiumUpgradeBanner } from "@/components/PremiumUpgradeBanner";
import SearchBar from "@/components/SearchBar";
import StockAnalysisNavButton from "@/components/StockAnalysisNavButton";
import UpgradeNavButton from "@/components/UpgradeNavButton";

export default async function Home() {
  const articles = await fetchMaNews();

  const LEAD_COUNT = 8;
  const leadUrls = new Set(articles.slice(0, LEAD_COUNT).map((a) => a.url));

  return (
    <>
      {/* Rotating ticker bar */}
      <TickerBar />

      {/* Header */}
      <header className="bg-ft-cream border-b border-ft-border">
        <div className="max-w-screen-xl mx-auto px-6 py-5 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ft-black leading-none">
            BLACKMERE INTELLIGENCE
          </h1>
          <p className="text-xs text-ft-muted mt-1 tracking-widest">
            M&amp;A DEAL TRACKER · MERGERS · ACQUISITIONS · DIVESTITURES
          </p>
        </div>
      </header>

      {/* Sector navigation — click to sector page */}
      <nav className="bg-ft-cream border-b border-ft-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center">
          <ul className="flex items-center text-xs font-semibold tracking-wide overflow-x-auto whitespace-nowrap py-0 flex-1">
            <li>
              <a href="#all-deals" className="nav-active inline-block py-3 px-3 hover:text-ft-teal">
                ALL DEALS
              </a>
            </li>
            {SECTOR_MAP.map((s) => (
              <li key={s.id}>
                <a
                  href={`/sectors/${s.id}`}
                  className="inline-block py-3 px-3 text-ft-muted hover:text-ft-teal hover:bg-ft-grey transition-colors"
                >
                  {s.label.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
          <div className="pl-4 py-1.5 flex-shrink-0 flex items-center gap-3">
            <SearchBar />
            <StockAnalysisNavButton />
            <UpgradeNavButton />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-6 py-6" id="all-deals">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left + Centre columns: lead stories + world map */}
          <LeadStories articles={articles} />

          {/* Right column: live news sidebar */}
          <div className="col-span-12 md:col-span-3">
            <NewsSection excludeUrls={Array.from(leadUrls)} />
          </div>
        </div>

        {/* FT-style spotlight — 4 most significant deals */}
        <DealSpotlight articles={articles} />

      </main>

      {/* Full-width orbital sector explorer */}
      <div className="max-w-screen-xl mx-auto px-6">
        <SectorOrbit articles={articles} />
      </div>

      {/* Landmark Deals of the Last Decade carousel */}
      <LandmarkDeals />

      {/* Premium upgrade banner — shown to free users at bottom of homepage */}
      <PremiumUpgradeBanner />

      {/* Footer */}
      <footer className="bg-ft-black text-gray-400 text-xs mt-0 px-6 py-8">
        <div className="max-w-screen-xl mx-auto flex flex-wrap gap-6 justify-between">
          <div>
            <p className="font-display text-white text-lg mb-2">Blackmere Intelligence</p>
            <p>Live M&A intelligence powered by Groq AI. Refreshes every 2 hours.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-white font-semibold mb-2">Sectors</p>
              <ul className="space-y-1">
                {SECTOR_MAP.map((s) => (
                  <li key={s.id}>
                    <a href={`/sectors/${s.id}`} className="hover:text-white">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">Data</p>
              <ul className="space-y-1">
                <li>Groq AI</li>
                <li>Deal Analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Article detail modal — client component, mounted once at root */}
      <ArticleDrawer />
      {/* Pre-warm AI briefing cache for the top 5 articles */}
      <BriefingPrefetcher articles={articles} />
    </>
  );
}
