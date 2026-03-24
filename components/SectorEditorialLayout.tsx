'use client';

import { Article } from '@/lib/news';

interface Deal {
  id: string;
  title: string;
  acquirer: string;
  target: string;
  description: string;
  value: string | null;
  date: string;
  status: string;
}

function openBriefing(deal: Deal) {
  const article: Article = {
    title: deal.title,
    description: deal.description,
    url: '',
    publishedAt: deal.date ? deal.date + 'T06:00:00Z' : new Date().toISOString(),
    source: { name: 'FMP' },
    acquirer: deal.acquirer,
    target: deal.target,
    dealValue: deal.value ?? undefined,
  };
  window.dispatchEvent(new CustomEvent('ft:open-article', { detail: article }));
}

export default function SectorEditorialLayout({
  deals,
  sectorLabel,
}: {
  deals: Deal[];
  sectorLabel: string;
}) {
  if (deals.length === 0) return null;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="border-b-2 border-ft-black pb-4 mb-8">
        <h1 className="font-display text-4xl font-bold text-ft-black uppercase">{sectorLabel}</h1>
        <p className="text-sm text-ft-muted mt-1">{deals.length} deals · Updated daily via FMP · Click any deal for AI briefing</p>
      </div>

      {/* HERO — first deal, full width, large */}
      <div
        className="cursor-pointer group border-b-2 border-ft-black pb-8 mb-8"
        onClick={() => openBriefing(deals[0])}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold tracking-widest text-ft-muted uppercase">{deals[0].status}</span>
          {deals[0].value && (
            <span className="bg-ft-black text-white text-xs px-2 py-0.5 font-semibold">{deals[0].value}</span>
          )}
          <span className="text-xs text-ft-muted ml-auto">{deals[0].date}</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ft-black leading-tight group-hover:text-ft-teal transition-colors mb-3">
          {deals[0].title}
        </h2>
        <p className="text-base text-ft-muted max-w-2xl leading-relaxed mb-4">{deals[0].description}</p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-ft-black border border-ft-black px-3 py-1">
            {deals[0].acquirer}
          </span>
          <span className="text-xs text-ft-muted">→</span>
          <span className="text-xs font-semibold text-ft-black border border-ft-black px-3 py-1">
            {deals[0].target}
          </span>
          <span className="text-xs text-ft-teal ml-auto font-semibold group-hover:underline">AI Briefing →</span>
        </div>
      </div>

      {/* SECONDARY ROW — deals 1–3, three columns */}
      {deals.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-ft-black mb-8">
          {deals.slice(1, 4).map((deal, i) => (
            <div
              key={deal.id}
              onClick={() => openBriefing(deal)}
              className={`cursor-pointer group p-6 hover:bg-ft-cream transition-colors ${i < 2 ? 'md:border-r border-ft-border' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-ft-muted uppercase tracking-wide">{deal.status}</span>
                {deal.value && <span className="text-xs font-bold text-ft-black ml-auto">{deal.value}</span>}
              </div>
              <h3 className="font-display font-bold text-base leading-snug group-hover:text-ft-teal transition-colors mb-2">
                {deal.title}
              </h3>
              <p className="text-xs text-ft-muted leading-relaxed line-clamp-3 mb-3">{deal.description}</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-ft-border">
                <span className="text-xs text-ft-muted">{deal.date}</span>
                <span className="text-xs text-ft-teal font-semibold group-hover:underline">AI Briefing →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TERTIARY — deals 4–7, two columns */}
      {deals.length > 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-ft-black mb-8">
          {deals.slice(4, 8).map((deal, i) => (
            <div
              key={deal.id}
              onClick={() => openBriefing(deal)}
              className={`cursor-pointer group p-6 hover:bg-ft-cream transition-colors ${i % 2 === 0 ? 'md:border-r border-ft-border' : ''} border-b border-ft-border last:border-b-0`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-display font-bold text-sm leading-snug group-hover:text-ft-teal transition-colors flex-1">
                  {deal.title}
                </h3>
                {deal.value && (
                  <span className="text-xs font-bold text-ft-black bg-ft-cream border border-ft-border px-2 py-0.5 whitespace-nowrap">
                    {deal.value}
                  </span>
                )}
              </div>
              <p className="text-xs text-ft-muted leading-relaxed mb-3">{deal.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ft-black">{deal.acquirer}</span>
                  <span className="text-xs text-ft-muted">→ {deal.target}</span>
                </div>
                <span className="text-xs text-ft-teal font-semibold group-hover:underline">AI Briefing →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REMAINING — deals 8+, compact list */}
      {deals.length > 8 && (
        <div className="border-b border-ft-black mb-8">
          <h3 className="font-display text-xs font-bold tracking-widest uppercase text-ft-muted mb-4">More Deals</h3>
          <div className="divide-y divide-ft-border">
            {deals.slice(8).map(deal => (
              <div
                key={deal.id}
                onClick={() => openBriefing(deal)}
                className="cursor-pointer group flex items-center justify-between py-3 hover:bg-ft-cream px-2 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {deal.value && (
                    <span className="text-xs font-bold text-ft-black whitespace-nowrap">{deal.value}</span>
                  )}
                  <span className="text-xs font-semibold text-ft-black group-hover:text-ft-teal transition-colors truncate">
                    {deal.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-xs text-ft-muted hidden md:block">{deal.date}</span>
                  <span className="text-xs text-ft-teal font-semibold group-hover:underline">Briefing →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
