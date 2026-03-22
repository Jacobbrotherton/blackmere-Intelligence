// Server component — no "use client" needed.
// Receives articles from the server page, picks the 4 best spotlight deals,
// and uses ArticleLink (client) to open the AI briefing modal on click.

import {
  Article,
  getSector,
  extractDealValue,
  formatDealValue,
  timeAgo,
} from "@/lib/news";
import ArticleLink from "@/components/ArticleLink";
import SpotlightImage from "@/components/SpotlightImage";

// ── Unique image pool (24 distinct URLs) ──────────────────────────────────────
const ALL_IMAGES = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
  "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=800&q=80",
  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
  "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
  "https://images.unsplash.com/photo-1619044882942-4c1b50793ade?w=800&q=80",
  "https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=800&q=80",
  "https://images.unsplash.com/photo-1604156425963-9be03f86a428?w=800&q=80",
];

/**
 * Pick exactly 4 UNIQUE images for the 4 spotlight cards.
 * Uses a seed derived from all 4 article titles so the set is
 * deterministic per page-load but varies as articles change.
 */
function pickFourUniqueImages(articles: Article[]): [string, string, string, string] {
  // Hash all article titles together into a single seed
  let seed = 0;
  for (const a of articles) {
    for (let i = 0; i < a.title.length; i++) {
      seed = (seed * 31 + a.title.charCodeAt(i)) >>> 0;
    }
  }

  // Rotate the pool by seed offset so different article sets start at different points
  const offset = seed % ALL_IMAGES.length;
  const rotated = [...ALL_IMAGES.slice(offset), ...ALL_IMAGES.slice(0, offset)];

  // The pool has 24 entries — take the first 4 (guaranteed unique)
  return [rotated[0], rotated[1], rotated[2], rotated[3]];
}

// ── Article selection ─────────────────────────────────────────────────────────
function selectSpotlightFour(articles: Article[]): Article[] {
  const usedUrls = new Set<string>();
  const unique: Article[] = [];
  const sorted = [...articles].sort((a, b) =>
    (b.description ? 1 : 0) - (a.description ? 1 : 0)
  );
  for (const article of sorted) {
    if (!usedUrls.has(article.url)) {
      usedUrls.add(article.url);
      unique.push(article);
    }
    if (unique.length === 4) break;
  }
  return unique;
}

// ── Card components ────────────────────────────────────────────────────────────
function PrimaryCard({ article, imageUrl }: { article: Article; imageUrl: string }) {
  const sector = getSector(article.title, article.description);
  const rawValue = extractDealValue(`${article.title} ${article.description ?? ""}`);
  const dealValueStr = rawValue !== null ? formatDealValue(rawValue) : null;

  return (
    <ArticleLink
      article={article}
      className="col-span-12 md:col-span-7 block cursor-pointer group"
    >
      <div className="overflow-hidden h-56 mb-4 w-full">
        <SpotlightImage
          src={imageUrl}
          alt={article.title}
          sector={sector}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-ft-red text-xs font-bold tracking-widest uppercase">
          {sector}
        </span>
        {dealValueStr && (
          <span className="bg-ft-teal text-white text-xs px-2 py-0.5 rounded-sm font-semibold">
            {dealValueStr}
          </span>
        )}
      </div>

      <h2 className="font-display text-2xl md:text-[1.75rem] font-bold leading-snug text-ft-black group-hover:text-ft-teal transition-colors mb-2">
        {article.title}
      </h2>

      {article.description && (
        <p className="text-sm text-ft-muted leading-relaxed line-clamp-3 mb-3">
          {article.description}
        </p>
      )}

      <span className="text-xs font-semibold text-ft-teal group-hover:underline">
        Read analysis →
      </span>
    </ArticleLink>
  );
}

function SecondaryCard({ article, imageUrl }: { article: Article; imageUrl: string }) {
  const sector = getSector(article.title, article.description);

  return (
    <ArticleLink
      article={article}
      className="col-span-12 md:col-span-5 block cursor-pointer group md:border-l md:border-ft-border md:pl-6"
    >
      <div className="overflow-hidden h-40 mb-4 w-full">
        <SpotlightImage
          src={imageUrl}
          alt={article.title}
          sector={sector}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <span
        className="block font-display text-4xl leading-none text-ft-teal mb-1 select-none"
        aria-hidden
      >
        &ldquo;
      </span>

      <h3 className="font-display text-lg font-semibold leading-snug text-ft-black group-hover:text-ft-teal transition-colors mb-2">
        {article.title}
      </h3>

      {article.description && (
        <p className="text-xs text-ft-muted leading-relaxed line-clamp-3 mb-2">
          {article.description}
        </p>
      )}

      <p className="text-xs text-ft-muted">
        — {article.source.name} · {timeAgo(article.publishedAt)}
      </p>
    </ArticleLink>
  );
}

// ── Spotlight section ─────────────────────────────────────────────────────────
export default function DealSpotlight({ articles }: { articles: Article[] }) {
  const picks = selectSpotlightFour(articles);
  if (picks.length < 1) return null;

  const [p1, p2, p3, p4] = picks;

  // Pre-select 4 guaranteed-unique images for all cards at once
  const [img0, img1, img2, img3] = pickFourUniqueImages(picks);

  return (
    <div className="border-t border-ft-border pt-6 pb-6 border-b border-ft-border">
      {/* Section label */}
      <p className="text-center text-xs font-bold tracking-[0.3em] text-ft-muted uppercase mb-6">
        Spotlight
      </p>

      {/* Row 1 */}
      <div className="grid grid-cols-12 gap-6 items-start mb-8">
        <PrimaryCard article={p1} imageUrl={img0} />
        <SecondaryCard article={p2} imageUrl={img1} />
      </div>

      {/* Row 2 */}
      {p3 && p4 && (
        <div className="grid grid-cols-12 gap-6 items-start border-t border-ft-border pt-6">
          <PrimaryCard article={p3} imageUrl={img2} />
          <SecondaryCard article={p4} imageUrl={img3} />
        </div>
      )}
    </div>
  );
}
