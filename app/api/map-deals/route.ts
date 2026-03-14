import { NextResponse } from "next/server";

// ── Company → lat/lng lookup (200+ entries) ───────────────────────────────────
const COMPANY_COORDS: Record<string, { lat: number; lng: number }> = {
  // US Tech
  "microsoft":        { lat: 47.674,  lng: -122.121 },
  "apple":            { lat: 37.335,  lng: -122.009 },
  "google":           { lat: 37.422,  lng: -122.084 },
  "alphabet":         { lat: 37.422,  lng: -122.084 },
  "amazon":           { lat: 47.606,  lng: -122.332 },
  "meta":             { lat: 37.484,  lng: -122.148 },
  "facebook":         { lat: 37.484,  lng: -122.148 },
  "netflix":          { lat: 37.258,  lng: -121.960 },
  "tesla":            { lat: 30.222,  lng: -97.657  },
  "nvidia":           { lat: 37.372,  lng: -121.975 },
  "intel":            { lat: 37.388,  lng: -121.964 },
  "qualcomm":         { lat: 32.900,  lng: -117.202 },
  "broadcom":         { lat: 37.338,  lng: -121.886 },
  "vmware":           { lat: 37.442,  lng: -122.143 },
  "salesforce":       { lat: 37.794,  lng: -122.396 },
  "oracle":           { lat: 30.222,  lng: -97.700  },
  "adobe":            { lat: 37.331,  lng: -121.893 },
  "servicenow":       { lat: 37.323,  lng: -122.031 },
  "workday":          { lat: 37.522,  lng: -121.981 },
  "splunk":           { lat: 37.787,  lng: -122.403 },
  "palo alto networks": { lat: 37.452, lng: -122.117 },
  "crowdstrike":      { lat: 30.381,  lng: -97.736  },
  "fortinet":         { lat: 37.335,  lng: -121.994 },
  "citrix":           { lat: 26.188,  lng: -80.143  },
  "slack":            { lat: 37.782,  lng: -122.393 },
  "twilio":           { lat: 37.787,  lng: -122.393 },
  "zoom":             { lat: 37.371,  lng: -122.057 },
  "docusign":         { lat: 37.782,  lng: -122.392 },
  "dropbox":          { lat: 37.776,  lng: -122.416 },
  "box":              { lat: 37.584,  lng: -122.057 },
  "zendesk":          { lat: 37.783,  lng: -122.409 },
  "hubspot":          { lat: 42.363,  lng: -71.084  },
  "activision":       { lat: 34.019,  lng: -118.491 },
  "ea":               { lat: 37.569,  lng: -122.053 },
  "electronic arts":  { lat: 37.569,  lng: -122.053 },
  "take-two":         { lat: 40.754,  lng: -73.988  },
  "ubisoft":          { lat: 48.857,  lng: 2.352    },
  "twitter":          { lat: 37.777,  lng: -122.416 },
  "x corp":           { lat: 37.777,  lng: -122.416 },
  "linkedin":         { lat: 37.398,  lng: -122.058 },
  "motorola":         { lat: 41.993,  lng: -87.908  },
  "whatsapp":         { lat: 37.388,  lng: -122.058 },
  "instagram":        { lat: 37.484,  lng: -122.150 },
  "youtube":          { lat: 37.422,  lng: -122.084 },
  "figma":            { lat: 37.778,  lng: -122.415 },

  // US Finance / Banking
  "jpmorgan":         { lat: 40.713,  lng: -74.006  },
  "jp morgan":        { lat: 40.713,  lng: -74.006  },
  "goldman sachs":    { lat: 40.714,  lng: -74.014  },
  "morgan stanley":   { lat: 40.757,  lng: -73.987  },
  "bank of america":  { lat: 35.227,  lng: -80.843  },
  "wells fargo":      { lat: 37.792,  lng: -122.397 },
  "citigroup":        { lat: 40.724,  lng: -74.000  },
  "citi":             { lat: 40.724,  lng: -74.000  },
  "blackrock":        { lat: 40.764,  lng: -73.973  },
  "blackstone":       { lat: 40.762,  lng: -73.975  },
  "kkr":              { lat: 40.754,  lng: -73.972  },
  "carlyle":          { lat: 38.906,  lng: -77.042  },
  "apollo":           { lat: 40.763,  lng: -73.976  },
  "first republic":   { lat: 37.775,  lng: -122.419 },
  "silicon valley bank": { lat: 37.450, lng: -122.066 },
  "svb":              { lat: 37.450,  lng: -122.066 },
  "credit suisse":    { lat: 47.372,  lng: 8.544    },
  "visa":             { lat: 37.384,  lng: -122.011 },
  "mastercard":       { lat: 40.760,  lng: -74.011  },
  "paypal":           { lat: 37.370,  lng: -121.925 },
  "stripe":           { lat: 37.782,  lng: -122.406 },
  "square":           { lat: 37.782,  lng: -122.405 },
  "block":            { lat: 37.782,  lng: -122.405 },
  "fiserv":           { lat: 43.041,  lng: -88.011  },
  "fidelity":         { lat: 42.347,  lng: -71.056  },
  "ameriprise":       { lat: 44.976,  lng: -93.266  },
  "schwab":           { lat: 32.899,  lng: -97.040  },
  "td ameritrade":    { lat: 41.267,  lng: -96.009  },
  "e*trade":          { lat: 40.759,  lng: -73.968  },
  "robinhood":        { lat: 37.441,  lng: -122.207 },

  // US Healthcare / Pharma
  "pfizer":           { lat: 40.750,  lng: -73.990  },
  "johnson & johnson": { lat: 40.574, lng: -74.527  },
  "abbvie":           { lat: 42.309,  lng: -88.083  },
  "merck":            { lat: 40.578,  lng: -74.526  },
  "eli lilly":        { lat: 39.768,  lng: -86.158  },
  "bristol-myers squibb": { lat: 40.693, lng: -74.041 },
  "amgen":            { lat: 34.140,  lng: -118.470 },
  "gilead":           { lat: 37.525,  lng: -122.018 },
  "biogen":           { lat: 42.344,  lng: -71.082  },
  "regeneron":        { lat: 41.126,  lng: -73.836  },
  "moderna":          { lat: 42.340,  lng: -71.070  },
  "seagen":           { lat: 47.762,  lng: -122.205 },
  "alexion":          { lat: 42.360,  lng: -71.059  },
  "shire":            { lat: 51.474,  lng: -0.452   },
  "allergan":         { lat: 35.195,  lng: -80.974  },
  "mylan":            { lat: 40.431,  lng: -79.967  },
  "bausch health":    { lat: 45.472,  lng: -73.741  },
  "unitedhealth":     { lat: 44.921,  lng: -93.469  },
  "unitedhealth group": { lat: 44.921, lng: -93.469 },
  "cvs":              { lat: 41.876,  lng: -71.379  },
  "aetna":            { lat: 41.751,  lng: -72.673  },
  "anthem":           { lat: 39.793,  lng: -86.228  },
  "cigna":            { lat: 41.765,  lng: -72.670  },
  "humana":           { lat: 38.252,  lng: -85.757  },
  "change healthcare": { lat: 36.163, lng: -86.782  },
  "optum":            { lat: 44.894,  lng: -93.464  },
  "express scripts":  { lat: 38.628,  lng: -90.411  },

  // US Energy / Industrials
  "exxonmobil":       { lat: 30.080,  lng: -95.417  },
  "chevron":          { lat: 37.938,  lng: -122.022 },
  "conoco":           { lat: 29.762,  lng: -95.431  },
  "conocophillips":   { lat: 29.762,  lng: -95.431  },
  "pioneer":          { lat: 32.814,  lng: -96.948  },
  "hess":             { lat: 41.052,  lng: -73.539  },
  "occidental":       { lat: 29.764,  lng: -95.371  },
  "anadarko":         { lat: 29.741,  lng: -95.419  },
  "halliburton":      { lat: 29.760,  lng: -95.396  },
  "schlumberger":     { lat: 29.759,  lng: -95.365  },
  "slb":              { lat: 29.759,  lng: -95.365  },
  "baker hughes":     { lat: 29.760,  lng: -95.398  },
  "ge":               { lat: 41.728,  lng: -72.652  },
  "general electric": { lat: 41.728,  lng: -72.652  },
  "honeywell":        { lat: 35.174,  lng: -80.945  },
  "3m":               { lat: 44.949,  lng: -93.098  },
  "emerson":          { lat: 38.589,  lng: -90.296  },
  "parker hannifin":  { lat: 41.432,  lng: -81.727  },
  "raytheon":         { lat: 42.333,  lng: -83.044  },
  "boeing":           { lat: 47.549,  lng: -122.313 },
  "lockheed martin":  { lat: 38.987,  lng: -77.075  },
  "northrop grumman": { lat: 37.095,  lng: -76.433  },
  "general dynamics": { lat: 38.837,  lng: -77.090  },
  "l3harris":         { lat: 28.549,  lng: -81.397  },

  // US Media / Retail / Consumer
  "disney":           { lat: 34.144,  lng: -118.250 },
  "comcast":          { lat: 39.951,  lng: -75.161  },
  "nbcuniversal":     { lat: 40.761,  lng: -73.989  },
  "at&t":             { lat: 32.779,  lng: -96.809  },
  "time warner":      { lat: 40.758,  lng: -73.986  },
  "discovery":        { lat: 38.961,  lng: -76.813  },
  "warner bros":      { lat: 34.148,  lng: -118.338 },
  "21st century fox": { lat: 40.758,  lng: -73.986  },
  "fox":              { lat: 40.758,  lng: -73.986  },
  "viacom":           { lat: 40.762,  lng: -73.985  },
  "cbs":              { lat: 40.759,  lng: -73.984  },
  "paramount":        { lat: 40.760,  lng: -73.986  },
  "mgm":              { lat: 34.073,  lng: -118.400 },
  "nbc":              { lat: 40.762,  lng: -73.988  },
  "mca":              { lat: 34.138,  lng: -118.355 },
  "walmart":          { lat: 36.373,  lng: -94.209  },
  "target":           { lat: 44.977,  lng: -93.274  },
  "kroger":           { lat: 39.101,  lng: -84.516  },
  "albertsons":       { lat: 43.618,  lng: -116.212 },
  "whole foods":      { lat: 30.280,  lng: -97.740  },
  "costco":           { lat: 47.596,  lng: -122.318 },
  "home depot":       { lat: 33.753,  lng: -84.388  },
  "lowe's":           { lat: 35.385,  lng: -80.857  },
  "best buy":         { lat: 44.855,  lng: -93.342  },
  "ebay":             { lat: 37.381,  lng: -122.003 },
  "etsy":             { lat: 40.688,  lng: -73.987  },

  // European Tech / Telecom
  "ericsson":         { lat: 59.336,  lng: 18.099   },
  "nokia":            { lat: 60.221,  lng: 24.759   },
  "alcatel":          { lat: 48.857,  lng: 2.352    },
  "siemens":          { lat: 48.140,  lng: 11.570   },
  "philips":          { lat: 52.370,  lng: 4.895    },
  "asml":             { lat: 51.408,  lng: 5.464    },
  "capgemini":        { lat: 48.877,  lng: 2.340    },
  "sap":              { lat: 49.292,  lng: 8.641    },
  "infineon":         { lat: 48.196,  lng: 11.616   },
  "arm":              { lat: 52.205,  lng: 0.122    },
  "vodafone":         { lat: 51.520,  lng: -0.155   },
  "bt":               { lat: 51.516,  lng: -0.117   },
  "bt group":         { lat: 51.516,  lng: -0.117   },
  "o2":               { lat: 51.518,  lng: -0.098   },
  "three":            { lat: 51.516,  lng: -0.134   },
  "sky":              { lat: 51.590,  lng: -0.300   },
  "swisscom":         { lat: 46.948,  lng: 7.451    },
  "orange":           { lat: 48.878,  lng: 2.327    },

  // European Finance
  "ubs":              { lat: 47.376,  lng: 8.541    },
  "hsbc":             { lat: 51.515,  lng: -0.089   },
  "barclays":         { lat: 51.519,  lng: -0.086   },
  "lloyds":           { lat: 51.513,  lng: -0.092   },
  "rbs":              { lat: 55.952,  lng: -3.193   },
  "natwest":          { lat: 51.510,  lng: -0.112   },
  "deutsche bank":    { lat: 50.113,  lng: 8.682    },
  "commerzbank":      { lat: 50.115,  lng: 8.673    },
  "bnp paribas":      { lat: 48.877,  lng: 2.329    },
  "societe generale": { lat: 48.884,  lng: 2.296    },
  "credit agricole":  { lat: 48.879,  lng: 2.322    },
  "ing":              { lat: 52.370,  lng: 4.892    },
  "abn amro":         { lat: 52.372,  lng: 4.897    },
  "santander":        { lat: 43.462,  lng: -3.810   },
  "bbva":             { lat: 43.274,  lng: -2.942   },
  "unicredit":        { lat: 45.465,  lng: 9.188    },
  "intesa sanpaolo":  { lat: 45.069,  lng: 7.686    },
  "allianz":          { lat: 48.143,  lng: 11.568   },
  "axa":              { lat: 48.877,  lng: 2.303    },
  "zurich":           { lat: 47.369,  lng: 8.539    },
  "swiss re":         { lat: 47.376,  lng: 8.541    },

  // European Pharma / Healthcare
  "astrazeneca":      { lat: 52.205,  lng: 0.122    },
  "glaxosmithkline":  { lat: 51.503,  lng: -0.175   },
  "gsk":              { lat: 51.503,  lng: -0.175   },
  "roche":            { lat: 47.558,  lng: 7.592    },
  "novartis":         { lat: 47.560,  lng: 7.594    },
  "sanofi":           { lat: 48.895,  lng: 2.270    },
  "bayer":            { lat: 51.038,  lng: 6.991    },
  "boehringer ingelheim": { lat: 49.989, lng: 8.236 },
  "fresenius":        { lat: 50.127,  lng: 8.677    },

  // European Industrials / Energy / Consumer
  "shell":            { lat: 52.093,  lng: 5.104    },
  "bp":               { lat: 51.515,  lng: -0.073   },
  "total":            { lat: 48.877,  lng: 2.347    },
  "totalenergies":    { lat: 48.877,  lng: 2.347    },
  "bg group":         { lat: 51.508,  lng: -0.128   },
  "equinor":          { lat: 58.965,  lng: 5.717    },
  "eni":              { lat: 41.913,  lng: 12.501   },
  "rwe":              { lat: 51.480,  lng: 6.998    },
  "e.on":             { lat: 51.452,  lng: 7.013    },
  "enel":             { lat: 41.893,  lng: 12.484   },
  "volkswagen":       { lat: 52.427,  lng: 10.785   },
  "porsche":          { lat: 48.833,  lng: 9.183    },
  "bmw":              { lat: 48.178,  lng: 11.556   },
  "daimler":          { lat: 48.786,  lng: 9.234    },
  "mercedes":         { lat: 48.786,  lng: 9.234    },
  "stellantis":       { lat: 45.557,  lng: 9.276    },
  "fca":              { lat: 45.557,  lng: 9.276    },
  "psa":              { lat: 48.802,  lng: 2.133    },
  "renault":          { lat: 48.802,  lng: 2.133    },
  "airbus":           { lat: 43.566,  lng: 1.405    },
  "rolls-royce":      { lat: 51.544,  lng: -0.023   },
  "lvmh":             { lat: 48.857,  lng: 2.352    },
  "kering":           { lat: 48.872,  lng: 2.305    },
  "hermes":           { lat: 48.857,  lng: 2.308    },
  "richemont":        { lat: 47.369,  lng: 8.539    },
  "tiffany":          { lat: 40.763,  lng: -73.975  },
  "ab inbev":         { lat: 50.880,  lng: 4.696    },
  "anheuser-busch":   { lat: 38.628,  lng: -90.418  },
  "sabmiller":        { lat: 51.513,  lng: -0.120   },
  "diageo":           { lat: 51.518,  lng: -0.143   },
  "unilever":         { lat: 51.516,  lng: -0.085   },
  "nestle":           { lat: 46.769,  lng: 6.648    },
  "danone":           { lat: 48.885,  lng: 2.348    },
  "ferrero":          { lat: 44.680,  lng: 8.033    },

  // Asian Companies
  "softbank":         { lat: 35.676,  lng: 139.650  },
  "sony":             { lat: 35.627,  lng: 139.726  },
  "toyota":           { lat: 35.082,  lng: 137.154  },
  "honda":            { lat: 35.759,  lng: 139.660  },
  "nissan":           { lat: 35.428,  lng: 139.636  },
  "panasonic":        { lat: 34.659,  lng: 135.499  },
  "hitachi":          { lat: 35.692,  lng: 139.747  },
  "toshiba":          { lat: 35.693,  lng: 139.718  },
  "fujitsu":          { lat: 35.646,  lng: 139.762  },
  "nec":              { lat: 35.688,  lng: 139.738  },
  "ntt":              { lat: 35.672,  lng: 139.739  },
  "rakuten":          { lat: 35.666,  lng: 139.724  },
  "nintendo":         { lat: 35.011,  lng: 135.750  },
  "sharp":            { lat: 34.686,  lng: 135.508  },
  "canon":            { lat: 35.718,  lng: 139.732  },
  "samsung":          { lat: 37.514,  lng: 127.103  },
  "lg":               { lat: 37.529,  lng: 126.925  },
  "sk":               { lat: 37.564,  lng: 126.976  },
  "hyundai":          { lat: 37.559,  lng: 127.007  },
  "kia":              { lat: 37.551,  lng: 126.989  },
  "alibaba":          { lat: 30.275,  lng: 120.155  },
  "tencent":          { lat: 22.544,  lng: 114.058  },
  "baidu":            { lat: 39.999,  lng: 116.318  },
  "jd.com":           { lat: 39.983,  lng: 116.320  },
  "bytedance":        { lat: 39.975,  lng: 116.457  },
  "huawei":           { lat: 22.575,  lng: 114.055  },
  "xiaomi":           { lat: 40.032,  lng: 116.315  },
  "didi":             { lat: 39.984,  lng: 116.304  },
  "meituan":          { lat: 22.540,  lng: 114.060  },
  "pinduoduo":        { lat: 31.231,  lng: 121.473  },
  "tata":             { lat: 18.931,  lng: 72.836   },
  "tata group":       { lat: 18.931,  lng: 72.836   },
  "infosys":          { lat: 12.971,  lng: 77.595   },
  "wipro":            { lat: 12.978,  lng: 77.548   },
  "hcl":              { lat: 28.459,  lng: 77.026   },
  "reliance":         { lat: 19.016,  lng: 72.858   },
  "hdfc":             { lat: 18.988,  lng: 72.836   },

  // Middle East / Africa / LatAm
  "saudi aramco":     { lat: 26.314,  lng: 50.137   },
  "sabic":            { lat: 24.714,  lng: 46.675   },
  "adnoc":            { lat: 24.453,  lng: 54.377   },
  "emirates":         { lat: 25.252,  lng: 55.364   },
  "mtn":              { lat: -26.195, lng: 28.034   },
  "naspers":          { lat: -33.922, lng: 18.424   },
  "prosus":           { lat: 52.370,  lng: 4.895    },
  "bhp":              { lat: -37.814, lng: 144.963  },
  "oz minerals":      { lat: -34.929, lng: 138.601  },
  "rio tinto":        { lat: 51.514,  lng: -0.124   },
  "glencore":         { lat: 47.169,  lng: 8.516    },
  "vale":             { lat: -22.906, lng: -43.172  },
  "petrobras":        { lat: -22.902, lng: -43.175  },
  "itau":             { lat: -23.544, lng: -46.634  },
  "bradesco":         { lat: -23.549, lng: -46.654  },
  "ambev":            { lat: -23.548, lng: -46.639  },
};

// ── Deal value parser ─────────────────────────────────────────────────────────
function parseDealValue(text: string): number {
  const clean = text.toLowerCase();
  // Patterns: $68.7bn, $68.7 billion, £14bn, €24bn, $1.2 trillion, $500m, $500 million
  const match = clean.match(
    /(?:[\$£€])\s*(\d+(?:\.\d+)?)\s*(trillion|billion|bn|million|mn|m)\b/
  ) ?? clean.match(
    /(\d+(?:\.\d+)?)\s*(trillion|billion|bn|million|mn|m)\s+(?:dollar|pound|euro)/
  );
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "trillion") return num * 1_000_000;
  if (unit === "billion" || unit === "bn") return num * 1_000;
  return num; // million — keep as-is (millions)
}

// ── Extract company names from article title ──────────────────────────────────
function findCompanies(title: string): string[] {
  const lower = title.toLowerCase();
  const found: string[] = [];
  // Sort by key length descending so longer matches win (e.g. "jp morgan" before "morgan")
  const keys = Object.keys(COMPANY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const idx = lower.indexOf(key);
    if (idx !== -1) {
      found.push(key);
      // Blank out matched text to avoid double-matching
      // (replace with spaces of same length)
      (lower as unknown as string[]).splice(idx, key.length, ...Array(key.length).fill(" "));
    }
    if (found.length >= 2) break;
  }
  return found;
}

// ── Fallback static dots (20 landmark deals) ─────────────────────────────────
const FALLBACK_DOTS = [
  { start: { lat: 47.674, lng: -122.121, label: "Microsoft ($68.7bn)" }, end: { lat: 34.019, lng: -118.491, label: "Activision" } },
  { start: { lat: 40.750, lng: -73.990, label: "Pfizer ($43bn)" }, end: { lat: 47.762, lng: -122.205, label: "Seagen" } },
  { start: { lat: 30.080, lng: -95.417, label: "ExxonMobil ($59.5bn)" }, end: { lat: 32.814, lng: -96.948, label: "Pioneer" } },
  { start: { lat: 40.713, lng: -74.006, label: "JPMorgan ($10.6bn)" }, end: { lat: 37.775, lng: -122.419, label: "First Republic" } },
  { start: { lat: 47.606, lng: -122.332, label: "Amazon ($8.5bn)" }, end: { lat: 34.073, lng: -118.400, label: "MGM" } },
  { start: { lat: 37.338, lng: -121.886, label: "Broadcom ($61bn)" }, end: { lat: 37.442, lng: -122.143, label: "VMware" } },
  { start: { lat: 52.205, lng: 0.122, label: "AstraZeneca ($39bn)" }, end: { lat: 42.360, lng: -71.059, label: "Alexion" } },
  { start: { lat: 48.857, lng: 2.352, label: "LVMH ($15.8bn)" }, end: { lat: 40.763, lng: -73.975, label: "Tiffany" } },
  { start: { lat: 35.676, lng: 139.650, label: "SoftBank ($32bn)" }, end: { lat: 52.205, lng: 0.122, label: "ARM" } },
  { start: { lat: 26.314, lng: 50.137, label: "Saudi Aramco ($69bn)" }, end: { lat: 24.714, lng: 46.675, label: "Sabic" } },
  { start: { lat: -37.814, lng: 144.963, label: "BHP ($9.6bn)" }, end: { lat: -34.929, lng: 138.601, label: "OZ Minerals" } },
  { start: { lat: 44.921, lng: -93.469, label: "UnitedHealth ($13.8bn)" }, end: { lat: 36.163, lng: -86.782, label: "Change Healthcare" } },
  { start: { lat: 34.144, lng: -118.250, label: "Disney ($71.3bn)" }, end: { lat: 40.758, lng: -73.986, label: "21st Century Fox" } },
  { start: { lat: 37.938, lng: -122.022, label: "Chevron ($53bn)" }, end: { lat: 41.052, lng: -73.539, label: "Hess" } },
  { start: { lat: 47.376, lng: 8.541, label: "UBS ($3.2bn)" }, end: { lat: 47.372, lng: 8.544, label: "Credit Suisse" } },
  { start: { lat: 52.427, lng: 10.785, label: "Volkswagen ($31.9bn)" }, end: { lat: 48.833, lng: 9.183, label: "Porsche" } },
  { start: { lat: 37.484, lng: -122.148, label: "Meta ($19bn)" }, end: { lat: 37.388, lng: -122.058, label: "WhatsApp" } },
  { start: { lat: 32.779, lng: -96.809, label: "AT&T ($85.4bn)" }, end: { lat: 40.758, lng: -73.986, label: "Time Warner" } },
  { start: { lat: 52.093, lng: 5.104, label: "Shell ($70bn)" }, end: { lat: 51.508, lng: -0.128, label: "BG Group" } },
  { start: { lat: 50.880, lng: 4.696, label: "AB InBev ($107bn)" }, end: { lat: 51.513, lng: -0.120, label: "SABMiller" } },
];

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { dots: FALLBACK_DOTS },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
    );
  }

  try {
    const params = new URLSearchParams({
      q: "merger OR acquisition OR acquires OR buyout",
      language: "en",
      sortBy: "publishedAt",
      pageSize: "100",
      searchIn: "title",
      apiKey,
    });

    const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { dots: FALLBACK_DOTS },
        { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
      );
    }

    const data = await res.json();
    const articles: { title: string; url: string }[] = data.articles ?? [];

    const dots: typeof FALLBACK_DOTS = [];
    const seen = new Set<string>();

    for (const article of articles) {
      if (dots.length >= 20) break;
      const { title } = article;

      // Parse deal value
      const value = parseDealValue(title);
      if (value < 500) continue; // Ignore deals under $500m

      // Find two companies
      const companies = findCompanies(title);
      if (companies.length < 2) continue;

      const [acquirer, target] = companies;
      const startCoord = COMPANY_COORDS[acquirer];
      const endCoord = COMPANY_COORDS[target];
      if (!startCoord || !endCoord) continue;

      // Skip if essentially the same location (avoids duplicate/same-city dots)
      const dist = Math.abs(startCoord.lat - endCoord.lat) + Math.abs(startCoord.lng - endCoord.lng);
      if (dist < 0.1) continue;

      const key = `${acquirer}→${target}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const valueLabel = value >= 1000 ? `$${(value / 1000).toFixed(1)}tn` : `$${value >= 1 ? value.toFixed(1) : (value * 1000).toFixed(0)}bn`;

      dots.push({
        start: {
          lat: startCoord.lat,
          lng: startCoord.lng,
          label: `${acquirer.charAt(0).toUpperCase() + acquirer.slice(1)} (${valueLabel})`,
        },
        end: {
          lat: endCoord.lat,
          lng: endCoord.lng,
          label: target.charAt(0).toUpperCase() + target.slice(1),
        },
      });
    }

    return NextResponse.json(
      { dots, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json(
      { dots: FALLBACK_DOTS },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
    );
  }
}
