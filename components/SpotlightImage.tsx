"use client";

import { useState } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

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
  // Reject placeholder/example URLs, fall back to a reliable default
  const initial = src && !src.includes("example.com") ? src : FALLBACK;
  const [imgSrc, setImgSrc] = useState<string>(initial);

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
        if (imgSrc !== FALLBACK) {
          setImgSrc(FALLBACK);
        } else {
          setImgSrc("");
        }
      }}
    />
  );
}
