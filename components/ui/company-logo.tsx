"use client";

import { useState } from "react";

// ── Domain mapping for known companies ───────────────────────────────────────
const DOMAIN_MAP: Record<string, string> = {
  // Deal companies
  "elon musk consortium":        "x.com",
  "openai":                      "openai.com",
  "amazon":                      "amazon.com",
  "tiktok us":                   "tiktok.com",
  "alphabet":                    "google.com",
  "alphabet (google)":           "google.com",
  "google":                      "google.com",
  "hubspot":                     "hubspot.com",
  "microsoft":                   "microsoft.com",
  "the trade desk":              "thetradedesk.com",
  "meta platforms":              "meta.com",
  "meta":                        "meta.com",
  "discord":                     "discord.com",
  "blackstone":                  "blackstone.com",
  "skechers":                    "skechers.com",
  "apollo global management":    "apollo.com",
  "apollo":                      "apollo.com",
  "intel foundry":               "intel.com",
  "intel":                       "intel.com",
  "apple":                       "apple.com",
  "peloton":                     "onepeloton.com",
  // New deal companies
  "paramount":                   "paramount.com",
  "warner bros. discovery":      "wbd.com",
  "union pacific":               "up.com",
  "norfolk southern":            "nscorp.com",
  "devon energy":                "devonenergy.com",
  "coterra energy":              "coterra.com",
  "charter communications":      "charter.com",
  "cox communications":          "cox.com",
  "revolution medicines":        "revmed.com",
  "merck":                       "merck.com",
  "denso":                       "denso.com",
  "rohm":                        "rohm.com",
  // Common companies
  "nvidia":                      "nvidia.com",
  "tesla":                       "tesla.com",
  "jpmorgan":                    "jpmorganchase.com",
  "jp morgan":                   "jpmorganchase.com",
  "goldman sachs":               "goldmansachs.com",
  "blackrock":                   "blackrock.com",
  "pfizer":                      "pfizer.com",
  "salesforce":                  "salesforce.com",
  "oracle":                      "oracle.com",
};

function inferDomain(name: string): string {
  const lower = name.toLowerCase().trim();
  if (DOMAIN_MAP[lower]) return DOMAIN_MAP[lower];
  // Best-guess: first word + .com
  const first = lower.split(/\s+/)[0].replace(/[^a-z0-9]/g, "");
  return `${first}.com`;
}

// ── Colour avatar fallback ────────────────────────────────────────────────────
const COLORS = [
  "bg-indigo-500", "bg-rose-500", "bg-violet-500", "bg-amber-500",
  "bg-teal-500", "bg-cyan-500", "bg-emerald-500", "bg-orange-500",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────
type LogoState = "primary" | "secondary" | "failed";

interface CompanyLogoProps {
  name: string;
  domain?: string;      // explicit domain (optional — inferred from name if omitted)
  size?: "sm" | "md" | "lg";
}

export default function CompanyLogo({ name, domain, size = "md" }: CompanyLogoProps) {
  const [state, setState] = useState<LogoState>("primary");

  const resolvedDomain = domain ?? inferDomain(name);
  const primaryUrl  = `https://www.google.com/s2/favicons?sz=128&domain_url=${resolvedDomain}`;
  const secondaryUrl = `https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`;

  const containerSize = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const imgSize      = size === "sm" ? "w-7 h-7"  : size === "lg" ? "w-11 h-11" : "w-8 h-8";
  const textSize     = size === "sm" ? "text-sm"  : size === "lg" ? "text-xl"   : "text-base";
  const initials     = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  if (state === "failed") {
    return (
      <div className={`${containerSize} rounded-xl ${colorFor(name)} flex items-center justify-center flex-shrink-0`}>
        <span className={`${textSize} font-bold text-white select-none`}>{initials}</span>
      </div>
    );
  }

  const imgSrc = state === "primary" ? primaryUrl : secondaryUrl;

  return (
    <div className={`${containerSize} rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imgSrc}
        src={imgSrc}
        alt={name}
        className={`${imgSize} object-contain`}
        onError={() => setState(state === "primary" ? "secondary" : "failed")}
      />
    </div>
  );
}
