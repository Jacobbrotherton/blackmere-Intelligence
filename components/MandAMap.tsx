"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Article, getSector, timeAgo, extractDealValue, formatDealValue } from "@/lib/news";
import type { CompanyMarker, DealConnection } from "@/components/LeafletMap";

// Disable SSR — Leaflet requires browser APIs (window, document)
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "300px" }}
      className="w-full bg-ft-cream border border-ft-border rounded-sm flex items-center justify-center animate-pulse"
    >
      <span className="text-xs text-ft-muted tracking-widest uppercase">Loading map…</span>
    </div>
  ),
});

interface CompanyInfo {
  lat: number;
  lng: number;
  city: string;
  displayName: string;
}

const COMPANIES: Record<string, CompanyInfo> = {
  "microsoft":       { lat: 47.674,  lng: -122.121, city: "Redmond, WA",        displayName: "Microsoft" },
  "activision":      { lat: 34.052,  lng: -118.244, city: "Los Angeles, CA",     displayName: "Activision" },
  "apple":           { lat: 37.332,  lng: -122.031, city: "Cupertino, CA",       displayName: "Apple" },
  "google":          { lat: 37.422,  lng: -122.084, city: "Mountain View, CA",   displayName: "Google" },
  "alphabet":        { lat: 37.422,  lng: -122.084, city: "Mountain View, CA",   displayName: "Alphabet" },
  "amazon":          { lat: 47.606,  lng: -122.332, city: "Seattle, WA",         displayName: "Amazon" },
  "meta":            { lat: 37.453,  lng: -122.182, city: "Menlo Park, CA",      displayName: "Meta" },
  "nvidia":          { lat: 37.370,  lng: -121.970, city: "Santa Clara, CA",     displayName: "Nvidia" },
  "intel":           { lat: 37.389,  lng: -121.964, city: "Santa Clara, CA",     displayName: "Intel" },
  "qualcomm":        { lat: 32.788,  lng: -117.168, city: "San Diego, CA",       displayName: "Qualcomm" },
  "broadcom":        { lat: 37.375,  lng: -121.981, city: "San Jose, CA",        displayName: "Broadcom" },
  "oracle":          { lat: 30.412,  lng:  -97.677, city: "Austin, TX",          displayName: "Oracle" },
  "salesforce":      { lat: 37.789,  lng: -122.397, city: "San Francisco, CA",   displayName: "Salesforce" },
  "adobe":           { lat: 37.332,  lng: -121.893, city: "San Jose, CA",        displayName: "Adobe" },
  "ibm":             { lat: 41.119,  lng:  -73.726, city: "Armonk, NY",          displayName: "IBM" },
  "cisco":           { lat: 37.365,  lng: -121.939, city: "San Jose, CA",        displayName: "Cisco" },
  "kkr":             { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "KKR" },
  "blackstone":      { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Blackstone" },
  "apollo":          { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Apollo" },
  "carlyle":         { lat: 38.907,  lng:  -77.037, city: "Washington, DC",      displayName: "Carlyle" },
  "warburg":         { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Warburg Pincus" },
  "goldman sachs":   { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Goldman Sachs" },
  "jpmorgan":        { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "JPMorgan" },
  "j.p. morgan":     { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "JPMorgan" },
  "morgan stanley":  { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Morgan Stanley" },
  "citigroup":       { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Citigroup" },
  "pfizer":          { lat: 40.755,  lng:  -73.984, city: "New York, NY",        displayName: "Pfizer" },
  "merck":           { lat: 40.667,  lng:  -74.410, city: "Rahway, NJ",          displayName: "Merck" },
  "abbvie":          { lat: 42.334,  lng:  -87.863, city: "North Chicago, IL",   displayName: "AbbVie" },
  "eli lilly":       { lat: 39.768,  lng:  -86.158, city: "Indianapolis, IN",    displayName: "Eli Lilly" },
  "astrazeneca":     { lat: 51.512,  lng:   -0.098, city: "London, UK",          displayName: "AstraZeneca" },
  "roche":           { lat: 47.559,  lng:    7.587, city: "Basel, Switzerland",  displayName: "Roche" },
  "novartis":        { lat: 47.559,  lng:    7.587, city: "Basel, Switzerland",  displayName: "Novartis" },
  "shell":           { lat: 51.507,  lng:   -0.128, city: "London, UK",          displayName: "Shell" },
  "exxonmobil":      { lat: 32.915,  lng:  -97.091, city: "Irving, TX",          displayName: "ExxonMobil" },
  "exxon":           { lat: 32.915,  lng:  -97.091, city: "Irving, TX",          displayName: "ExxonMobil" },
  "chevron":         { lat: 37.519,  lng: -122.030, city: "San Ramon, CA",       displayName: "Chevron" },
  "totalenergies":   { lat: 48.857,  lng:    2.352, city: "Paris, France",       displayName: "TotalEnergies" },
  "bp":              { lat: 51.507,  lng:   -0.128, city: "London, UK",          displayName: "BP" },
  "hsbc":            { lat: 51.507,  lng:   -0.128, city: "London, UK",          displayName: "HSBC" },
  "barclays":        { lat: 51.507,  lng:   -0.128, city: "London, UK",          displayName: "Barclays" },
  "ubs":             { lat: 47.376,  lng:    8.548, city: "Zürich, Switzerland", displayName: "UBS" },
  "deutsche bank":   { lat: 50.107,  lng:    8.662, city: "Frankfurt, Germany",  displayName: "Deutsche Bank" },
  "bnp paribas":     { lat: 48.857,  lng:    2.352, city: "Paris, France",       displayName: "BNP Paribas" },
  "softbank":        { lat: 35.676,  lng:  139.650, city: "Tokyo, Japan",        displayName: "SoftBank" },
  "sony":            { lat: 35.676,  lng:  139.650, city: "Tokyo, Japan",        displayName: "Sony" },
  "samsung":         { lat: 37.566,  lng:  126.978, city: "Seoul, South Korea",  displayName: "Samsung" },
  "alibaba":         { lat: 30.274,  lng:  120.155, city: "Hangzhou, China",     displayName: "Alibaba" },
  "tencent":         { lat: 22.543,  lng:  114.058, city: "Shenzhen, China",     displayName: "Tencent" },
  "sap":             { lat: 49.295,  lng:    8.642, city: "Walldorf, Germany",   displayName: "SAP" },
  "siemens":         { lat: 48.135,  lng:   11.582, city: "Munich, Germany",     displayName: "Siemens" },
  "lvmh":            { lat: 48.857,  lng:    2.352, city: "Paris, France",       displayName: "LVMH" },
  "unilever":        { lat: 51.507,  lng:   -0.128, city: "London, UK",          displayName: "Unilever" },
  "nestle":          { lat: 46.748,  lng:    6.857, city: "Vevey, Switzerland",  displayName: "Nestlé" },
  "berkshire":       { lat: 41.257,  lng:  -95.938, city: "Omaha, NE",           displayName: "Berkshire Hathaway" },
  "disney":          { lat: 33.812,  lng: -117.919, city: "Burbank, CA",         displayName: "Disney" },
  "comcast":         { lat: 39.952,  lng:  -75.165, city: "Philadelphia, PA",    displayName: "Comcast" },
  "verizon":         { lat: 40.713,  lng:  -74.006, city: "New York, NY",        displayName: "Verizon" },
  "t-mobile":        { lat: 47.614,  lng: -122.195, city: "Bellevue, WA",        displayName: "T-Mobile" },
};

// Sort by key length descending to prevent shorter keys matching first
const SORTED_COMPANIES = Object.entries(COMPANIES).sort(([a], [b]) => b.length - a.length);

function extractCompanies(article: Article): Array<CompanyInfo> {
  const text = ` ${article.title.toLowerCase()} ${(article.description ?? "").toLowerCase()} `;
  const found: CompanyInfo[] = [];

  for (const [key, info] of SORTED_COMPANIES) {
    const k = key.toLowerCase();
    const idx = text.indexOf(k);
    if (idx === -1) continue;
    const before = text[idx - 1] ?? " ";
    const after  = text[idx + k.length] ?? " ";
    if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue;
    if (!found.some((f) => f.displayName === info.displayName)) {
      found.push(info);
    }
  }
  return found;
}

export default function MandAMap({ articles }: { articles: Article[] }) {
  const { markers, connections, liveCount } = useMemo(() => {
    // Map: displayName → marker data
    const markerMap = new Map<string, CompanyMarker>();
    const connections: DealConnection[] = [];

    for (const article of articles) {
      const companies = extractCompanies(article);
      const text = `${article.title} ${article.description ?? ""}`;
      const rawValue = extractDealValue(text);
      const dealValue = rawValue !== null ? formatDealValue(rawValue) : null;
      const sector    = getSector(article.title, article.description);
      const articleSummary = {
        title:      article.title,
        url:        article.url,
        sourceName: article.source.name,
        timeAgoStr: timeAgo(article.publishedAt),
        dealValue,
        sector,
      };

      // Build markers
      for (const co of companies) {
        if (!markerMap.has(co.displayName)) {
          markerMap.set(co.displayName, {
            lat:         co.lat,
            lng:         co.lng,
            displayName: co.displayName,
            city:        co.city,
            articles:    [],
          });
        }
        const existing = markerMap.get(co.displayName)!;
        if (!existing.articles.some((a) => a.url === article.url)) {
          existing.articles.push(articleSummary);
        }
      }

      // Build connection lines between the first two companies in each article
      if (companies.length >= 2 && connections.length < 15) {
        const [a, b] = companies;
        const alreadyLinked = connections.some(
          (c) =>
            (c.from[0] === a.lat && c.from[1] === a.lng &&
             c.to[0]   === b.lat && c.to[1]   === b.lng) ||
            (c.from[0] === b.lat && c.from[1] === b.lng &&
             c.to[0]   === a.lat && c.to[1]   === a.lng)
        );
        if (!alreadyLinked) {
          connections.push({
            from: [a.lat, a.lng],
            to:   [b.lat, b.lng],
          });
        }
      }
    }

    return {
      markers:   Array.from(markerMap.values()),
      connections,
      liveCount: markerMap.size,
    };
  }, [articles]);

  // Mounted guard: Leaflet requires browser APIs that don't exist during SSR.
  // Even with ssr:false on the dynamic import, this ensures MapContainer is
  // never instantiated before the client is fully hydrated.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold tracking-widest text-ft-muted uppercase">
          M&amp;A Global Activity
        </span>
        <span className="text-xs text-ft-muted">
          {liveCount > 0
            ? `${liveCount} companies · ${connections.length} deal connections`
            : "Click markers to view deals"}
        </span>
      </div>

      {/* Interactive Leaflet map — only mount after client hydration */}
      {mounted ? (
        <LeafletMap markers={markers} connections={connections} />
      ) : (
        <div
          style={{ height: "300px" }}
          className="w-full bg-ft-cream border border-ft-border rounded-sm flex items-center justify-center"
        >
          <span className="text-xs text-ft-muted tracking-widest uppercase">Loading map…</span>
        </div>
      )}

      {liveCount === 0 && mounted && (
        <p className="text-center text-xs text-ft-muted mt-1.5">
          No company HQs matched in current articles — check back after a news refresh.
        </p>
      )}
    </div>
  );
}
