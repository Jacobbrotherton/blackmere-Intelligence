"use client";

import { useState } from "react";

// Large pool of unique business/deal/finance images — one per spotlight card
const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", // city skyscraper
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", // boardroom
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", // deal signing
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", // charts laptop
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80", // stock market
  "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80", // building glass
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80", // finance graph
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", // analytics
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80", // gold coins
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80", // handshake
  "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=800&q=80", // NYC skyline
  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80", // trading floor
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80", // stock ticker
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", // tech circuit
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", // healthcare
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80", // energy wind
  "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", // industrial
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80", // private equity
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80", // media
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80", // pharma lab
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80", // laptop finance
  "https://images.unsplash.com/photo-1619044882942-4c1b50793ade?w=800&q=80", // globe deal
  "https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=800&q=80", // London city
  "https://images.unsplash.com/photo-1604156425963-9be03f86a428?w=800&q=80", // semiconductor
];

// Sector-specific pools for more relevant imagery
const SECTOR_POOLS: Record<string, string[]> = {
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    "https://images.unsplash.com/photo-1604156425963-9be03f86a428?w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
  ],
  healthcare: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    "https://images.unsplash.com/photo-1576671414121-aa0c81c869e1?w=800&q=80",
  ],
  financials: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  ],
  energy: [
    "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
    "https://images.unsplash.com/photo-1548337138-e87d889cc369?w=800&q=80",
  ],
  industrials: [
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  ],
  "private equity": [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
  ],
  media: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=800&q=80",
  ],
};

/** Pick a deterministic but unique image for each article based on title hash + index */
function getImageForArticle(title: string, sector: string, index: number): string {
  // Simple hash from title string
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }

  // Try sector pool first
  const sectorKey = sector.toLowerCase();
  for (const [k, pool] of Object.entries(SECTOR_POOLS)) {
    if (sectorKey.includes(k)) {
      return pool[(hash + index) % pool.length];
    }
  }

  // Fall back to main pool, offset by index to guarantee uniqueness across 4 cards
  return IMAGE_POOL[(hash + index * 7) % IMAGE_POOL.length];
}

export default function SpotlightImage({
  src,
  alt,
  sector,
  className = "",
  index = 0,
}: {
  src: string | null;
  alt: string;
  sector: string;
  className?: string;
  index?: number;
}) {
  const poolImage = getImageForArticle(alt, sector, index);
  // Only use `src` if it's a real external image (not an example.com URL)
  const resolvedSrc =
    src && !src.includes("example.com") ? src : poolImage;

  const [imgSrc, setImgSrc] = useState<string>(resolvedSrc);

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
      style={{ objectPosition: "center 20%" }}
      onError={() => {
        if (imgSrc !== poolImage) {
          setImgSrc(poolImage);
        } else {
          setImgSrc("");
        }
      }}
    />
  );
}
