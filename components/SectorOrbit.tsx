"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Article, SECTOR_MAP } from "@/lib/news";

const CX = 260, CY = 260;
const R_OUT = 205;
const R_IN = 110;
const R_TEXT = 162;
const EXPLODE = 20;
const GAP_DEG = 2.5;

const COLORS = [
  "#0D7680",
  "#990F3D",
  "#003A6C",
  "#B07D1C",
  "#4A6741",
  "#6B3A2A",
];

const LABEL_LINES: Record<string, string[]> = {
  technology: ["Technology"],
  healthcare: ["Healthcare"],
  financials: ["Financials"],
  energy: ["Energy"],
  industrials: ["Industrials"],
  "private-equity": ["Private", "Equity"],
};

function p2c(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function slicePath(start: number, end: number, rOut: number, rIn: number): string {
  const [x1, y1] = p2c(start, rOut);
  const [x2, y2] = p2c(end, rOut);
  const [x3, y3] = p2c(end, rIn);
  const [x4, y4] = p2c(start, rIn);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

function matchesSector(article: Article, sectorId: string, keywords: readonly string[]): boolean {
  if (article.sector) {
    const as = article.sector.toLowerCase().trim();
    const sid = sectorId.toLowerCase().replace(/-/g, " ");
    if (as.includes(sid) || sid.includes(as) || as === sid) return true;
    if (sectorId === "private-equity" && (as.includes("private equity") || as.includes("pe "))) return true;
    if (sectorId === "technology" && (as.includes("tech") || as.includes("ai") || as.includes("software"))) return true;
    if (sectorId === "financials" && (as.includes("financial") || as.includes("finance") || as.includes("banking"))) return true;
  }
  const text = `${article.title} ${article.description ?? ""}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

export default function SectorOrbit({ articles, sectorCounts }: { articles: Article[]; sectorCounts?: Record<string, number> }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  const segDeg = (360 - SECTOR_MAP.length * GAP_DEG) / SECTOR_MAP.length;

  return (
    <section className="mt-10 border-t-2 border-ft-black">
      <div className="py-6">
        <h2 className="font-display text-2xl font-bold text-ft-black">
          Browse by Sector
        </h2>
        <p className="text-sm text-ft-muted mt-1">
          Click any segment to explore its deals
        </p>
      </div>

      <div className="flex justify-center py-4">
        <svg
          viewBox="0 0 520 520"
          width="520"
          height="520"
          className="max-w-full"
          style={{ overflow: "visible" }}
        >
          {SECTOR_MAP.map((sector, i) => {
            const startAngle = -90 + i * (segDeg + GAP_DEG);
            const endAngle = startAngle + segDeg;
            const midAngle = startAngle + segDeg / 2;
            const isHovered = hovered === sector.id;
            const count = sectorCounts?.[sector.id] ?? articles.filter((a) => matchesSector(a, sector.id, sector.keywords)).length;
            const color = COLORS[i];
            const lines = LABEL_LINES[sector.id] ?? [sector.label];
            const [txText, tyText] = p2c(midAngle, R_TEXT);
            const tx = isHovered ? EXPLODE * Math.cos((midAngle * Math.PI) / 180) : 0;
            const ty = isHovered ? EXPLODE * Math.sin((midAngle * Math.PI) / 180) : 0;

            return (
              <g
                key={sector.id}
                style={{
                  transform: `translate(${tx}px, ${ty}px)`,
                  transition: "transform 0.22s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered(sector.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/sectors/${sector.id}`)}
              >
                <path
                  d={slicePath(startAngle, endAngle, R_OUT, R_IN)}
                  fill={color}
                  stroke="#fff1e0"
                  strokeWidth="3"
                  style={{
                    filter: isHovered
                      ? "brightness(1.18) drop-shadow(0 6px 16px rgba(0,0,0,0.35))"
                      : "none",
                    transition: "filter 0.22s ease",
                  }}
                />
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={txText}
                    y={tyText + (li - (lines.length - 1) / 2) * 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="'Source Sans 3', system-ui, sans-serif"
                    letterSpacing="0.4"
                    style={{ pointerEvents: "none" }}
                  >
                    {line}
                  </text>
                ))}
                <text
                  x={txText}
                  y={tyText + lines.length * 13 + 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="9.5"
                  fontFamily="'Source Sans 3', system-ui, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {count} deal{count !== 1 ? "s" : ""}
                </text>
              </g>
            );
          })}

          {/* Centre label */}
          <circle cx={CX} cy={CY} r={R_IN - 8} fill="#fff1e0" />
          <text
            x={CX}
            y={CY - 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#1A1A1A"
            fontSize="14"
            fontWeight="700"
            fontFamily="'Playfair Display', Georgia, serif"
            letterSpacing="1"
          >
            M&amp;A
          </text>
          <text
            x={CX}
            y={CY + 11}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#807060"
            fontSize="8"
            fontFamily="'Source Sans 3', system-ui, sans-serif"
            letterSpacing="3"
          >
            SECTORS
          </text>
        </svg>
      </div>
    </section>
  );
}
