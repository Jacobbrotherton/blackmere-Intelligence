"use client";

import { useState } from "react";

// Fallback Unsplash images per sector keyword
const SECTOR_FALLBACKS: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  healthcare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  financials: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  finance: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  banking: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  energy: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
  industrials: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80",
  "private equity": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
  media: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
  retail: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80",
  pharma: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

function getFallback(sector: string): string {
  const key = sector.toLowerCase();
  for (const [k, v] of Object.entries(SECTOR_FALLBACKS)) {
    if (key.includes(k)) return v;
  }
  return DEFAULT_FALLBACK;
}

export default function SpotlightImage({
  src,
  alt,
  sector,
  className = "",
}: {
  src: string | null;
  alt: string;
  sector: string;
  className?: string;
}) {
  const fallback = getFallback(sector);
  const [imgSrc, setImgSrc] = useState<string | null>(src || fallback);

  if (!imgSrc) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ background: "#D4C5A9" }}
      >
        <span className="text-[#8B7355] text-xs font-bold uppercase tracking-[0.25em]">
          {sector}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={`w-full h-full object-cover object-top ${className}`}
      style={{ objectPosition: 'center 15%' }}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        } else {
          setImgSrc(null);
        }
      }}
    />
  );
}
