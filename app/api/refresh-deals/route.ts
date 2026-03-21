export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { groqChat } from "@/lib/groq";

// ── Hardcoded fallback deals (shown if Groq fails) ────────────────────────────
const FALLBACK_DEALS = [
  {
    id: "paramount-warner-bros",
    acquirerName: "Warner Bros. Discovery",
    acquirerTicker: "WBD",
    acquirerLogo: "https://logo.clearbit.com/wbd.com",
    targetName: "Paramount Global",
    targetTicker: "PARA",
    targetLogo: "https://logo.clearbit.com/paramount.com",
    dealType: "Merger",
    estimatedValue: "$28B",
    estimatedValueNum: 28,
    summary: "Warner Bros. Discovery and Paramount Global are in advanced merger talks, driven by accelerating subscriber losses and the need to compete with Netflix and Disney+. A combined entity would create the largest US streaming library outside of Netflix.",
    source: "Wall Street Journal (rumoured)",
    dateRumoured: "2026-02",
    status: "Talks Confirmed",
    sector: "Media / Streaming",
    dealProbability: 72,
    probabilityRationale: "Both boards engaged, regulatory landscape favourable post-Trump administration.",
    keyStats: { acquirerMarketCap: "$18B", targetMarketCap: "$8B", estimatedPremium: "35%", sectorAvgMultiple: "8.2x EV/EBITDA" },
  },
  {
    id: "devon-coterra",
    acquirerName: "Devon Energy",
    acquirerTicker: "DVN",
    acquirerLogo: "https://logo.clearbit.com/devonenergy.com",
    targetName: "Coterra Energy",
    targetTicker: "CTRA",
    targetLogo: "https://logo.clearbit.com/coterra.com",
    dealType: "Merger",
    estimatedValue: "$20B",
    estimatedValueNum: 20,
    summary: "Devon Energy is pursuing Coterra Energy in a stock-for-stock merger that would create a Permian Basin powerhouse. The deal would add significant Marcellus shale gas assets and reduce Devon's oil-price sensitivity.",
    source: "Bloomberg (rumoured)",
    dateRumoured: "2026-01",
    status: "Talks Confirmed",
    sector: "Energy / E&P",
    dealProbability: 65,
    probabilityRationale: "Complementary basin exposure and both management teams publicly open to consolidation.",
    keyStats: { acquirerMarketCap: "$22B", targetMarketCap: "$17B", estimatedPremium: "20%", sectorAvgMultiple: "4.5x EV/EBITDA" },
  },
  {
    id: "charter-cox",
    acquirerName: "Charter Communications",
    acquirerTicker: "CHTR",
    acquirerLogo: "https://logo.clearbit.com/charter.com",
    targetName: "Cox Communications",
    targetTicker: "PRIVATE",
    targetLogo: "https://logo.clearbit.com/cox.com",
    dealType: "Acquisition",
    estimatedValue: "$34.5B",
    estimatedValueNum: 34.5,
    summary: "Charter is in talks to acquire privately-held Cox Communications, which would create the largest US cable operator with over 30 million subscribers. The deal would give Charter significant scale advantages against streaming competitors.",
    source: "Financial Times (rumoured)",
    dateRumoured: "2026-02",
    status: "Talks Confirmed",
    sector: "Telecoms / Cable",
    dealProbability: 60,
    probabilityRationale: "Cox family exploring strategic options; Charter has strongest synergy case.",
    keyStats: { acquirerMarketCap: "$48B", targetMarketCap: "N/A (private)", estimatedPremium: "N/A", sectorAvgMultiple: "9.1x EV/EBITDA" },
  },
  {
    id: "merck-revolution-medicines",
    acquirerName: "Merck",
    acquirerTicker: "MRK",
    acquirerLogo: "https://logo.clearbit.com/merck.com",
    targetName: "Revolution Medicines",
    targetTicker: "RVMD",
    targetLogo: "https://logo.clearbit.com/revmed.com",
    dealType: "Acquisition",
    estimatedValue: "$15B",
    estimatedValueNum: 15,
    summary: "Merck is reportedly evaluating a bid for Revolution Medicines to bolster its oncology pipeline ahead of Keytruda patent expiry in 2028. Revolution's RAS-targeted therapies represent a compelling complement to Merck's immuno-oncology franchise.",
    source: "Reuters (rumoured)",
    dateRumoured: "2026-03",
    status: "Rumour",
    sector: "Healthcare / Oncology",
    dealProbability: 45,
    probabilityRationale: "Merck needs pipeline replenishment; Revolution's RAS program is best-in-class.",
    keyStats: { acquirerMarketCap: "$260B", targetMarketCap: "$8B", estimatedPremium: "40%", sectorAvgMultiple: "N/A (pre-revenue)" },
  },
  {
    id: "apple-peloton",
    acquirerName: "Apple",
    acquirerTicker: "AAPL",
    acquirerLogo: "https://logo.clearbit.com/apple.com",
    targetName: "Peloton",
    targetTicker: "PTON",
    targetLogo: "https://logo.clearbit.com/onepeloton.com",
    dealType: "Acquisition",
    estimatedValue: "$1.8B",
    estimatedValueNum: 1.8,
    summary: "Apple is rumoured to be evaluating Peloton as a connected-fitness acquisition that would integrate with Apple Fitness+ and Apple Watch. Peloton's subscriber base and content library would accelerate Apple's health platform ambitions.",
    source: "Bloomberg (rumoured)",
    dateRumoured: "2026-01",
    status: "Rumour",
    sector: "Consumer Tech / Fitness",
    dealProbability: 30,
    probabilityRationale: "Apple rarely acquires hardware companies; strategic fit is strong but deal is speculative.",
    keyStats: { acquirerMarketCap: "$3.2T", targetMarketCap: "$1.1B", estimatedPremium: "60%", sectorAvgMultiple: "1.2x EV/Revenue" },
  },
  {
    id: "union-pacific-norfolk-southern",
    acquirerName: "Union Pacific",
    acquirerTicker: "UNP",
    acquirerLogo: "https://logo.clearbit.com/up.com",
    targetName: "Norfolk Southern",
    targetTicker: "NSC",
    targetLogo: "https://logo.clearbit.com/nscorp.com",
    dealType: "Merger",
    estimatedValue: "$85B",
    estimatedValueNum: 85,
    summary: "Union Pacific has approached Norfolk Southern about a transformational merger that would create a coast-to-coast Class I railroad. The deal faces significant STB regulatory scrutiny but would generate substantial network synergies.",
    source: "Wall Street Journal (rumoured)",
    dateRumoured: "2026-01",
    status: "Under Review",
    sector: "Industrials / Rail",
    dealProbability: 35,
    probabilityRationale: "Regulatory approval from STB is a major hurdle; STB has historically blocked rail mega-mergers.",
    keyStats: { acquirerMarketCap: "$135B", targetMarketCap: "$55B", estimatedPremium: "25%", sectorAvgMultiple: "14.2x EV/EBITDA" },
  },
  {
    id: "denso-rohm",
    acquirerName: "Denso",
    acquirerTicker: "DNZOY",
    acquirerLogo: "https://logo.clearbit.com/denso.com",
    targetName: "Rohm",
    targetTicker: "ROHCY",
    targetLogo: "https://logo.clearbit.com/rohm.com",
    dealType: "Acquisition",
    estimatedValue: "$8.3B",
    estimatedValueNum: 8.3,
    summary: "Toyota-backed Denso is pursuing Rohm to secure SiC power semiconductor supply as automotive electrification accelerates. The deal would give Denso control over a critical EV component supply chain.",
    source: "Nikkei (rumoured)",
    dateRumoured: "2026-02",
    status: "Talks Confirmed",
    sector: "Auto / Semiconductors",
    dealProbability: 68,
    probabilityRationale: "Strategic imperative clear; Toyota group consolidation of auto suppliers is ongoing.",
    keyStats: { acquirerMarketCap: "$44B", targetMarketCap: "$6B", estimatedPremium: "38%", sectorAvgMultiple: "12.1x EV/EBITDA" },
  },
  {
    id: "adobe-figma-redux",
    acquirerName: "Adobe",
    acquirerTicker: "ADBE",
    acquirerLogo: "https://logo.clearbit.com/adobe.com",
    targetName: "Canva",
    targetTicker: "PRIVATE",
    targetLogo: "https://logo.clearbit.com/canva.com",
    dealType: "Acquisition",
    estimatedValue: "$19B",
    estimatedValueNum: 19,
    summary: "Adobe is reportedly circling Canva as a strategic response to the collapse of its Figma acquisition and mounting competition in the collaborative design space. A deal would give Adobe dominance across both professional and consumer design workflows.",
    source: "Bloomberg (rumoured)",
    dateRumoured: "2026-02",
    status: "Rumour",
    sector: "Software / Design",
    dealProbability: 38,
    probabilityRationale: "Adobe faces antitrust scrutiny after the failed Figma deal; regulatory risk remains elevated.",
    keyStats: { acquirerMarketCap: "$180B", targetMarketCap: "$26B (last private round)", estimatedPremium: "N/A (private)", sectorAvgMultiple: "15x EV/Revenue" },
  },
  {
    id: "hsbc-standard-chartered",
    acquirerName: "HSBC",
    acquirerTicker: "HSBA",
    acquirerLogo: "https://logo.clearbit.com/hsbc.com",
    targetName: "Standard Chartered",
    targetTicker: "STAN",
    targetLogo: "https://logo.clearbit.com/sc.com",
    dealType: "Merger",
    estimatedValue: "$42B",
    estimatedValueNum: 42,
    summary: "HSBC and Standard Chartered have held exploratory talks about a merger that would create the world's largest emerging markets bank by assets. A combined entity would have unrivalled coverage across Asia, Africa and the Middle East.",
    source: "Financial Times (rumoured)",
    dateRumoured: "2026-01",
    status: "Rumour",
    sector: "Banking / Financial Services",
    dealProbability: 25,
    probabilityRationale: "Cultural and regulatory complexity across 50+ jurisdictions makes execution extremely difficult.",
    keyStats: { acquirerMarketCap: "$180B", targetMarketCap: "$25B", estimatedPremium: "30%", sectorAvgMultiple: "1.1x Book Value" },
  },
  {
    id: "amazon-tiktok-us",
    acquirerName: "Amazon",
    acquirerTicker: "AMZN",
    acquirerLogo: "https://logo.clearbit.com/amazon.com",
    targetName: "TikTok US",
    targetTicker: "PRIVATE",
    targetLogo: "https://logo.clearbit.com/tiktok.com",
    dealType: "Acquisition",
    estimatedValue: "$50B",
    estimatedValueNum: 50,
    summary: "Amazon has emerged as a serious bidder for TikTok's US operations following the forced divestiture deadline imposed by Congress. A deal would integrate TikTok's 170 million US users with Amazon's advertising and e-commerce infrastructure.",
    source: "Wall Street Journal (rumoured)",
    dateRumoured: "2026-02",
    status: "Under Review",
    sector: "Social Media / E-commerce",
    dealProbability: 42,
    probabilityRationale: "ByteDance reluctant to sell algorithm; competing bids from Oracle and others complicate the process.",
    keyStats: { acquirerMarketCap: "$2.1T", targetMarketCap: "$50B (estimated)", estimatedPremium: "N/A", sectorAvgMultiple: "N/A (strategic asset)" },
  },
  {
    id: "bp-woodside",
    acquirerName: "Woodside Energy",
    acquirerTicker: "WDS",
    acquirerLogo: "https://logo.clearbit.com/woodside.com",
    targetName: "BP",
    targetTicker: "BP",
    targetLogo: "https://logo.clearbit.com/bp.com",
    dealType: "Merger",
    estimatedValue: "$55B",
    estimatedValueNum: 55,
    summary: "Australian LNG giant Woodside is said to be evaluating a merger with a restructured BP following the latter's strategic reset under new management. The deal would create a global LNG powerhouse with operations spanning Australia, the Americas and North Sea.",
    source: "Reuters (rumoured)",
    dateRumoured: "2026-03",
    status: "Rumour",
    sector: "Energy / LNG",
    dealProbability: 22,
    probabilityRationale: "BP's market cap makes this a stretch; political considerations in the UK add significant complexity.",
    keyStats: { acquirerMarketCap: "$35B", targetMarketCap: "$80B", estimatedPremium: "20%", sectorAvgMultiple: "5.2x EV/EBITDA" },
  },
  {
    id: "pfizer-biontech",
    acquirerName: "Pfizer",
    acquirerTicker: "PFE",
    acquirerLogo: "https://logo.clearbit.com/pfizer.com",
    targetName: "BioNTech",
    targetTicker: "BNTX",
    targetLogo: "https://logo.clearbit.com/biontech.de",
    dealType: "Acquisition",
    estimatedValue: "$22B",
    estimatedValueNum: 22,
    summary: "Pfizer is exploring a full acquisition of its mRNA partner BioNTech to secure long-term access to next-generation oncology and infectious disease pipelines. Pfizer already owns approximately 1.2% of BioNTech following their COVID-19 vaccine collaboration.",
    source: "Bloomberg (rumoured)",
    dateRumoured: "2026-01",
    status: "Rumour",
    sector: "Healthcare / Biotech",
    dealProbability: 35,
    probabilityRationale: "BioNTech founders resistant to full acquisition; mRNA oncology pipeline creates compelling strategic logic.",
    keyStats: { acquirerMarketCap: "$140B", targetMarketCap: "$18B", estimatedPremium: "25%", sectorAvgMultiple: "N/A (pipeline valued on DCF)" },
  },
  {
    id: "softbank-arm-intel-foundry",
    acquirerName: "SoftBank",
    acquirerTicker: "SFTBY",
    acquirerLogo: "https://logo.clearbit.com/softbank.com",
    targetName: "Intel Foundry",
    targetTicker: "INTC",
    targetLogo: "https://logo.clearbit.com/intel.com",
    dealType: "Acquisition",
    estimatedValue: "$30B",
    estimatedValueNum: 30,
    summary: "SoftBank is in discussions to acquire Intel's foundry division as Intel separates its chip design and manufacturing businesses. The deal would give SoftBank's Arm subsidiary direct access to leading-edge semiconductor fabrication capacity.",
    source: "Nikkei / Financial Times (rumoured)",
    dateRumoured: "2026-02",
    status: "Under Review",
    sector: "Semiconductors / Foundry",
    dealProbability: 40,
    probabilityRationale: "US national security concerns around foreign ownership of domestic semiconductor capacity are a key obstacle.",
    keyStats: { acquirerMarketCap: "$90B", targetMarketCap: "$90B (Intel)", estimatedPremium: "N/A (division carve-out)", sectorAvgMultiple: "2.5x EV/Revenue" },
  },
  {
    id: "lvmh-richemont",
    acquirerName: "LVMH",
    acquirerTicker: "MC",
    acquirerLogo: "https://logo.clearbit.com/lvmh.com",
    targetName: "Richemont",
    targetTicker: "CFR",
    targetLogo: "https://logo.clearbit.com/richemont.com",
    dealType: "Merger",
    estimatedValue: "$68B",
    estimatedValueNum: 68,
    summary: "LVMH has long coveted Richemont's jewellery brands Cartier and Van Cleef & Arpels and is said to have renewed takeover interest following Richemont patriarch Johann Rupert's succession planning. A deal would give LVMH unrivalled dominance across hard luxury.",
    source: "Le Monde / FT (rumoured)",
    dateRumoured: "2026-01",
    status: "Rumour",
    sector: "Luxury Goods",
    dealProbability: 20,
    probabilityRationale: "Rupert family retains voting control and has consistently rebuffed LVMH overtures; deal requires family blessing.",
    keyStats: { acquirerMarketCap: "$290B", targetMarketCap: "$58B", estimatedPremium: "18%", sectorAvgMultiple: "18x EV/EBITDA" },
  },
  {
    id: "microsoft-mongodb",
    acquirerName: "Microsoft",
    acquirerTicker: "MSFT",
    acquirerLogo: "https://logo.clearbit.com/microsoft.com",
    targetName: "MongoDB",
    targetTicker: "MDB",
    targetLogo: "https://logo.clearbit.com/mongodb.com",
    dealType: "Acquisition",
    estimatedValue: "$18B",
    estimatedValueNum: 18,
    summary: "Microsoft is evaluating an acquisition of MongoDB to deepen its Azure database portfolio and reduce enterprise reliance on competing cloud database providers. MongoDB's Atlas platform has over 46,000 customers and is growing rapidly in AI application infrastructure.",
    source: "Bloomberg (rumoured)",
    dateRumoured: "2026-03",
    status: "Rumour",
    sector: "Cloud / Database",
    dealProbability: 33,
    probabilityRationale: "Microsoft has strong strategic motive but antitrust scrutiny of Big Tech acquisitions remains high in 2026.",
    keyStats: { acquirerMarketCap: "$3T", targetMarketCap: "$14B", estimatedPremium: "28%", sectorAvgMultiple: "12x EV/Revenue" },
  },
  {
    id: "diageo-heineken",
    acquirerName: "Diageo",
    acquirerTicker: "DGE",
    acquirerLogo: "https://logo.clearbit.com/diageo.com",
    targetName: "Heineken",
    targetTicker: "HEIO",
    targetLogo: "https://logo.clearbit.com/heineken.com",
    dealType: "Merger",
    estimatedValue: "$45B",
    estimatedValueNum: 45,
    summary: "Diageo is rumoured to be considering a transformational merger with Heineken that would create the world's largest consumer drinks company spanning beer, spirits and RTDs. The combined group would have distribution coverage in over 180 countries.",
    source: "Reuters / Dealreporter (rumoured)",
    dateRumoured: "2026-02",
    status: "Rumour",
    sector: "Consumer / Beverages",
    dealProbability: 18,
    probabilityRationale: "Heineken family trust holds controlling stake and has historically prioritised independence; cross-border regulatory hurdles significant.",
    keyStats: { acquirerMarketCap: "$55B", targetMarketCap: "$38B", estimatedPremium: "20%", sectorAvgMultiple: "13x EV/EBITDA" },
  },
];

let cachedDeals: unknown[] = [];
let lastRefreshed: number = 0;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// ── Robust JSON extractor — finds the first [...] block in any string ─────────
function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array found");
  const slice = text.slice(start, end + 1);
  const parsed = JSON.parse(slice);
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed;
}

// ── Validate a single deal has the minimum required fields ────────────────────
function isValidDeal(d: unknown): boolean {
  if (!d || typeof d !== "object") return false;
  const obj = d as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.acquirerName === "string" &&
    typeof obj.targetName === "string" &&
    typeof obj.estimatedValue === "string"
  );
}

export async function GET() {
  const now = Date.now();

  if (cachedDeals.length > 0 && now - lastRefreshed < CACHE_DURATION_MS) {
    return NextResponse.json({
      deals: cachedDeals,
      lastRefreshed: new Date(lastRefreshed).toISOString(),
      fromCache: true,
    });
  }

  try {
    const systemPrompt = `You are an expert M&A intelligence analyst. Return ONLY a valid JSON array. No markdown, no backticks, no explanation — just the raw JSON array starting with [ and ending with ].`;

    const userPrompt = `Generate 17 current unconfirmed M&A rumours as of early 2026. Return a JSON array of 17 objects. Each object must have exactly these fields:
id (string slug), acquirerName (string), acquirerTicker (string), acquirerLogo (clearbit URL), targetName (string), targetTicker (string), targetLogo (clearbit URL), dealType (string), estimatedValue (string like "$28B"), estimatedValueNum (number), summary (string 2-3 sentences), source (string), dateRumoured (YYYY-MM string), status (one of: Rumour, Talks Confirmed, Under Review), sector (string), dealProbability (integer 1-100), probabilityRationale (string), keyStats (object with acquirerMarketCap, targetMarketCap, estimatedPremium, sectorAvgMultiple all strings).
Start your response with [ and end with ]. No other text.`;

    const response = await groqChat(systemPrompt, userPrompt);
    const deals = extractJsonArray(response);
    const validDeals = deals.filter(isValidDeal);

    if (validDeals.length < 3) {
      throw new Error(`Only ${validDeals.length} valid deals returned`);
    }

    cachedDeals = validDeals;
    lastRefreshed = now;

    return NextResponse.json({
      deals: validDeals,
      lastRefreshed: new Date(now).toISOString(),
      fromCache: false,
    });
  } catch (error: unknown) {
    console.error("Failed to refresh deals, using fallback:", error);

    // Always return fallback deals — page is never empty
    if (cachedDeals.length === 0) {
      cachedDeals = FALLBACK_DEALS;
      lastRefreshed = now;
    }

    return NextResponse.json({
      deals: cachedDeals,
      lastRefreshed: new Date(lastRefreshed).toISOString(),
      fromCache: true,
    });
  }
}
