"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { WorldMap } from "@/components/ui/map";
import { Maximize2, Minimize2 } from "lucide-react";

// ── 20 landmark M&A deal connections (static fallback) ────────────────────────
const STATIC_DOTS = [
  {
    start: { lat: 47.674, lng: -122.121, label: "Microsoft ($68.7bn)" },
    end:   { lat: 34.019, lng: -118.491, label: "Activision" },
  },
  {
    start: { lat: 40.750, lng: -73.990, label: "Pfizer ($43bn)" },
    end:   { lat: 47.762, lng: -122.205, label: "Seagen" },
  },
  {
    start: { lat: 30.080, lng: -95.417, label: "ExxonMobil ($59.5bn)" },
    end:   { lat: 32.814, lng: -96.948, label: "Pioneer" },
  },
  {
    start: { lat: 40.713, lng: -74.006, label: "JPMorgan ($10.6bn)" },
    end:   { lat: 37.775, lng: -122.419, label: "First Republic" },
  },
  {
    start: { lat: 47.606, lng: -122.332, label: "Amazon ($8.5bn)" },
    end:   { lat: 34.073, lng: -118.400, label: "MGM" },
  },
  {
    start: { lat: 37.338, lng: -121.886, label: "Broadcom ($61bn)" },
    end:   { lat: 37.442, lng: -122.143, label: "VMware" },
  },
  {
    start: { lat: 52.205, lng: 0.122, label: "AstraZeneca ($39bn)" },
    end:   { lat: 42.360, lng: -71.059, label: "Alexion" },
  },
  {
    start: { lat: 48.857, lng: 2.352, label: "LVMH ($15.8bn)" },
    end:   { lat: 40.763, lng: -73.975, label: "Tiffany" },
  },
  {
    start: { lat: 35.676, lng: 139.650, label: "SoftBank ($32bn)" },
    end:   { lat: 52.205, lng: 0.122,   label: "ARM" },
  },
  {
    start: { lat: 26.314, lng: 50.137, label: "Saudi Aramco ($69bn)" },
    end:   { lat: 24.714, lng: 46.675, label: "Sabic" },
  },
  {
    start: { lat: -37.814, lng: 144.963, label: "BHP ($9.6bn)" },
    end:   { lat: -34.929, lng: 138.601, label: "OZ Minerals" },
  },
  {
    start: { lat: 44.921, lng: -93.469, label: "UnitedHealth ($13.8bn)" },
    end:   { lat: 36.163, lng: -86.782, label: "Change Healthcare" },
  },
  {
    start: { lat: 34.144, lng: -118.250, label: "Disney ($71.3bn)" },
    end:   { lat: 40.758, lng: -73.986, label: "21st Century Fox" },
  },
  {
    start: { lat: 37.938, lng: -122.022, label: "Chevron ($53bn)" },
    end:   { lat: 41.052, lng: -73.539, label: "Hess" },
  },
  {
    start: { lat: 47.376, lng: 8.541, label: "UBS ($3.2bn)" },
    end:   { lat: 47.372, lng: 8.544, label: "Credit Suisse" },
  },
  {
    start: { lat: 52.427, lng: 10.785, label: "Volkswagen ($31.9bn)" },
    end:   { lat: 48.833, lng: 9.183, label: "Porsche" },
  },
  {
    start: { lat: 37.484, lng: -122.148, label: "Meta ($19bn)" },
    end:   { lat: 37.388, lng: -122.058, label: "WhatsApp" },
  },
  {
    start: { lat: 32.779, lng: -96.809, label: "AT&T ($85.4bn)" },
    end:   { lat: 40.758, lng: -73.986, label: "Time Warner" },
  },
  {
    start: { lat: 52.093, lng: 5.104, label: "Shell ($70bn)" },
    end:   { lat: 51.508, lng: -0.128, label: "BG Group" },
  },
  {
    start: { lat: 50.880, lng: 4.696, label: "AB InBev ($107bn)" },
    end:   { lat: 51.513, lng: -0.120, label: "SABMiller" },
  },
];

// ── Briefing lookup by company name ──────────────────────────────────────────
const BRIEFINGS: Record<string, { headline: string; url: string }> = {
  "microsoft":         { headline: "Microsoft acquires Activision Blizzard for $68.7 billion — the largest gaming deal in history", url: "https://www.bbc.com/news/technology-67064752" },
  "activision":        { headline: "Microsoft acquires Activision Blizzard for $68.7 billion — the largest gaming deal in history", url: "https://www.bbc.com/news/technology-67064752" },
  "pfizer":            { headline: "Pfizer acquires Seagen for $43 billion, betting big on oncology ADCs", url: "https://www.pfizer.com/news/press-release/press-release-detail/pfizer-completes-acquisition-seagen" },
  "seagen":            { headline: "Pfizer acquires Seagen for $43 billion, betting big on oncology ADCs", url: "https://www.pfizer.com/news/press-release/press-release-detail/pfizer-completes-acquisition-seagen" },
  "exxonmobil":        { headline: "ExxonMobil acquires Pioneer Natural Resources for $59.5 billion in biggest oil deal in decades", url: "https://corporate.exxonmobil.com/news/news-releases/2023/1011_exxonmobil-to-acquire-pioneer-natural-resources" },
  "pioneer":           { headline: "ExxonMobil acquires Pioneer Natural Resources for $59.5 billion in biggest oil deal in decades", url: "https://corporate.exxonmobil.com/news/news-releases/2023/1011_exxonmobil-to-acquire-pioneer-natural-resources" },
  "jpmorgan":          { headline: "JPMorgan Chase acquires First Republic Bank for $10.6 billion after FDIC seizure", url: "https://www.bbc.com/news/business-65473815" },
  "first republic":    { headline: "JPMorgan Chase acquires First Republic Bank for $10.6 billion after FDIC seizure", url: "https://www.bbc.com/news/business-65473815" },
  "amazon":            { headline: "Amazon acquires MGM Studios for $8.5 billion to bolster Prime Video", url: "https://www.bbc.com/news/business-57228492" },
  "mgm":               { headline: "Amazon acquires MGM Studios for $8.5 billion to bolster Prime Video", url: "https://www.bbc.com/news/business-57228492" },
  "broadcom":          { headline: "Broadcom acquires VMware for $61 billion in the largest ever tech acquisition", url: "https://www.bbc.com/news/technology-67494254" },
  "vmware":            { headline: "Broadcom acquires VMware for $61 billion in the largest ever tech acquisition", url: "https://www.bbc.com/news/technology-67494254" },
  "astrazeneca":       { headline: "AstraZeneca acquires Alexion Pharmaceuticals for $39 billion to enter rare disease", url: "https://www.bbc.com/news/business-55254979" },
  "alexion":           { headline: "AstraZeneca acquires Alexion Pharmaceuticals for $39 billion to enter rare disease", url: "https://www.bbc.com/news/business-55254979" },
  "lvmh":              { headline: "LVMH acquires Tiffany & Co for $15.8 billion in luxury megadeal", url: "https://www.bbc.com/news/business-55237338" },
  "tiffany":           { headline: "LVMH acquires Tiffany & Co for $15.8 billion in luxury megadeal", url: "https://www.bbc.com/news/business-55237338" },
  "softbank":          { headline: "SoftBank acquires ARM Holdings for $32 billion, the largest ever semiconductor deal", url: "https://www.bbc.com/news/technology-37345015" },
  "arm":               { headline: "SoftBank acquires ARM Holdings for $32 billion, the largest ever semiconductor deal", url: "https://www.bbc.com/news/technology-37345015" },
  "saudi aramco":      { headline: "Saudi Aramco acquires 70% stake in SABIC from Public Investment Fund for $69 billion", url: "https://www.bbc.com/news/business-47509798" },
  "sabic":             { headline: "Saudi Aramco acquires 70% stake in SABIC from Public Investment Fund for $69 billion", url: "https://www.bbc.com/news/business-47509798" },
  "bhp":               { headline: "BHP acquires OZ Minerals for $9.6 billion to expand copper and nickel assets", url: "https://www.bbc.com/news/business-63862882" },
  "oz minerals":       { headline: "BHP acquires OZ Minerals for $9.6 billion to expand copper and nickel assets", url: "https://www.bbc.com/news/business-63862882" },
  "unitedhealth":      { headline: "UnitedHealth Group acquires Change Healthcare for $13.8 billion to accelerate digital health", url: "https://www.bbc.com/news/business-60659764" },
  "change healthcare": { headline: "UnitedHealth Group acquires Change Healthcare for $13.8 billion to accelerate digital health", url: "https://www.bbc.com/news/business-60659764" },
  "disney":            { headline: "Disney acquires 21st Century Fox for $71.3 billion, reshaping global entertainment", url: "https://www.bbc.com/news/business-46476128" },
  "21st century fox":  { headline: "Disney acquires 21st Century Fox for $71.3 billion, reshaping global entertainment", url: "https://www.bbc.com/news/business-46476128" },
  "chevron":           { headline: "Chevron acquires Hess Corporation for $53 billion in major oil patch consolidation", url: "https://www.bbc.com/news/business-67065178" },
  "hess":              { headline: "Chevron acquires Hess Corporation for $53 billion in major oil patch consolidation", url: "https://www.bbc.com/news/business-67065178" },
  "ubs":               { headline: "UBS acquires Credit Suisse for $3.2 billion in emergency rescue brokered by Swiss government", url: "https://www.bbc.com/news/business-65010762" },
  "credit suisse":     { headline: "UBS acquires Credit Suisse for $3.2 billion in emergency rescue brokered by Swiss government", url: "https://www.bbc.com/news/business-65010762" },
  "volkswagen":        { headline: "Volkswagen acquires full control of Porsche AG for $31.9 billion in historic family deal", url: "https://www.bbc.com/news/business-63124097" },
  "porsche":           { headline: "Volkswagen acquires full control of Porsche AG for $31.9 billion in historic family deal", url: "https://www.bbc.com/news/business-63124097" },
  "meta":              { headline: "Meta (Facebook) acquires WhatsApp for $19 billion in defining social media deal", url: "https://www.bbc.com/news/business-26428984" },
  "whatsapp":          { headline: "Meta (Facebook) acquires WhatsApp for $19 billion in defining social media deal", url: "https://www.bbc.com/news/business-26428984" },
  "at&t":              { headline: "AT&T acquires Time Warner for $85.4 billion, merging telecoms with media", url: "https://www.bbc.com/news/business-38274143" },
  "time warner":       { headline: "AT&T acquires Time Warner for $85.4 billion, merging telecoms with media", url: "https://www.bbc.com/news/business-38274143" },
  "shell":             { headline: "Shell acquires BG Group for $70 billion, transforming into global LNG leader", url: "https://www.bbc.com/news/business-32173990" },
  "bg group":          { headline: "Shell acquires BG Group for $70 billion, transforming into global LNG leader", url: "https://www.bbc.com/news/business-32173990" },
  "ab inbev":          { headline: "AB InBev acquires SABMiller for $107 billion — the world's largest ever beer deal", url: "https://www.bbc.com/news/business-34666571" },
  "sabmiller":         { headline: "AB InBev acquires SABMiller for $107 billion — the world's largest ever beer deal", url: "https://www.bbc.com/news/business-34666571" },
};

interface MapDot {
  start: { lat: number; lng: number; label: string };
  end:   { lat: number; lng: number; label: string };
}

function openBriefingForLabel(label: string) {
  const company = label.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase().trim();
  const briefing = BRIEFINGS[company] ?? {
    headline: `${label} — M&A deal analysis`,
    url: "#",
  };

  window.dispatchEvent(
    new CustomEvent("ft:open-article", {
      detail: {
        title: briefing.headline,
        description: `AI-powered strategic analysis of the ${label.replace(/\s*\([^)]*\)/, "")} deal, covering rationale, market context, and regulatory outlook.`,
        url: briefing.url,
        urlToImage: null,
        publishedAt: new Date().toISOString(),
        source: { name: "Blackmere Intelligence", id: null },
        content: null,
      },
    })
  );
}

const LIVE_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

export default function TopWorldMap() {
  const [fullscreen, setFullscreen] = useState(false);
  const [dots, setDots] = useState<MapDot[]>(STATIC_DOTS);
  const [dotCount, setDotCount] = useState(STATIC_DOTS.length);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, startTransition] = useTransition();

  const fetchLiveDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/map-deals");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const liveDots: MapDot[] = data.dots ?? [];
      if (liveDots.length >= 10) {
        // Supplement with static deals to reach 20 if live data is sparse
        const needed = Math.max(0, 20 - liveDots.length);
        const supplement = STATIC_DOTS.slice(0, needed);
        const merged = [...liveDots, ...supplement];
        startTransition(() => {
          setDots(merged);
          setDotCount(merged.length);
          setLastUpdated(new Date());
        });
      } else {
        // Fall back to static if < 10 live deals
        startTransition(() => {
          setDots(STATIC_DOTS);
          setDotCount(STATIC_DOTS.length);
          setLastUpdated(new Date());
        });
      }
    } catch {
      // Keep static dots on failure
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchLiveDeals();
    const timer = setInterval(fetchLiveDeals, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchLiveDeals]);

  const mapProps = {
    dots,
    lineColor: "#CC0000" as const,
    onDotClick: openBriefingForLabel,
  };

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold tracking-widest text-ft-muted uppercase">
          M&amp;A Global Activity
        </span>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-ft-muted/60">
              Live · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className="text-xs text-ft-muted">
            {dotCount} deal connections
          </span>
          <button
            onClick={() => setFullscreen(true)}
            className="text-ft-teal hover:text-ft-black transition-colors"
            title="View full map"
            aria-label="Expand map to fullscreen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Inline map */}
      <WorldMap
        {...mapProps}
        containerClassName="aspect-[5/3]"
      />

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-10"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute -top-9 right-0 text-white hover:text-gray-300 flex items-center gap-1.5 text-sm font-medium"
              aria-label="Exit fullscreen"
            >
              <Minimize2 size={16} />
              Exit fullscreen
            </button>
            <WorldMap
              {...mapProps}
              onDotClick={(label) => {
                setFullscreen(false);
                setTimeout(() => openBriefingForLabel(label), 150);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
