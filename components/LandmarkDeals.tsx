"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

// ── Static landmark deals data ─────────────────────────────────────────────────
const LANDMARK_DEALS = [
  {
    id: "microsoft-linkedin",
    title: "Microsoft acquires LinkedIn for $26.2bn",
    description:
      "The largest social network acquisition in history, giving Microsoft access to 430 million professionals and transforming enterprise software forever.",
    year: "2016",
    sector: "Technology",
    value: "$26.2bn",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&q=80",
    briefingHeadline: "Microsoft acquires LinkedIn for $26.2 billion",
    briefingUrl: "https://news.microsoft.com/2016/06/13/microsoft-to-acquire-linkedin/",
  },
  {
    id: "disney-fox",
    title: "Disney acquires 21st Century Fox for $71.3bn",
    description:
      "A landmark media consolidation that gave Disney control of Avatar, X-Men, and a majority stake in Hulu, reshaping the streaming wars.",
    year: "2019",
    sector: "Media",
    value: "$71.3bn",
    image:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1080&q=80",
    briefingHeadline: "Disney acquires 21st Century Fox for $71.3 billion",
    briefingUrl: "https://www.bbc.com/news/business-46786935",
  },
  {
    id: "amazon-wholefoods",
    title: "Amazon acquires Whole Foods for $13.7bn",
    description:
      "Amazon's bold entry into physical retail signalled the death of the traditional supermarket model and accelerated the omnichannel revolution.",
    year: "2017",
    sector: "Retail",
    value: "$13.7bn",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1080&q=80",
    briefingHeadline: "Amazon acquires Whole Foods for $13.7 billion",
    briefingUrl: "https://www.bbc.com/news/business-40320493",
  },
  {
    id: "broadcom-vmware",
    title: "Broadcom acquires VMware for $61bn",
    description:
      "The largest tech acquisition ever completed, combining Broadcom's semiconductors with VMware's cloud infrastructure software.",
    year: "2023",
    sector: "Technology",
    value: "$61bn",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1080&q=80",
    briefingHeadline: "Broadcom acquires VMware for $61 billion",
    briefingUrl: "https://www.bbc.com/news/technology-67494254",
  },
  {
    id: "exxon-pioneer",
    title: "Exxon acquires Pioneer Natural Resources for $59.5bn",
    description:
      "The biggest oil deal in decades, doubling Exxon's Permian Basin output and signalling Big Oil's confidence in long-term fossil fuel demand.",
    year: "2023",
    sector: "Energy",
    value: "$59.5bn",
    image:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1080&q=80",
    briefingHeadline: "ExxonMobil acquires Pioneer Natural Resources for $59.5 billion",
    briefingUrl: "https://corporate.exxonmobil.com/news/news-releases/2023/1011_exxonmobil-to-acquire-pioneer-natural-resources",
  },
  {
    id: "microsoft-activision",
    title: "Microsoft acquires Activision Blizzard for $68.7bn",
    description:
      "The largest gaming deal in history, giving Microsoft control of Call of Duty, Candy Crush and 30 studios after a two-year regulatory battle.",
    year: "2023",
    sector: "Technology",
    value: "$68.7bn",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1080&q=80",
    briefingHeadline: "Microsoft acquires Activision Blizzard for $68.7 billion",
    briefingUrl: "https://www.bbc.com/news/technology-67064752",
  },
  {
    id: "pfizer-seagen",
    title: "Pfizer acquires Seagen for $43bn",
    description:
      "Pfizer's largest acquisition, securing a pipeline of cancer-fighting antibody-drug conjugates and betting big on oncology as its next growth engine.",
    year: "2023",
    sector: "Healthcare",
    value: "$43bn",
    image:
      "https://images.unsplash.com/photo-1576671081837-49000212a7a7?w=1080&q=80",
    briefingHeadline: "Pfizer acquires Seagen for $43 billion",
    briefingUrl: "https://www.pfizer.com/news/press-release/press-release-detail/pfizer-completes-acquisition-seagen",
  },
];

// ── Synthetic article shape for the briefing modal ────────────────────────────
function makeSyntheticArticle(deal: (typeof LANDMARK_DEALS)[number]) {
  return {
    title: deal.briefingHeadline,
    description: deal.description,
    url: deal.briefingUrl,
    urlToImage: deal.image,
    publishedAt: `${deal.year}-01-01T00:00:00Z`,
    source: { name: "Landmark Deal", id: null },
    content: null,
  };
}

function openBriefing(deal: (typeof LANDMARK_DEALS)[number]) {
  const article = makeSyntheticArticle(deal);
  window.dispatchEvent(
    new CustomEvent("ft:open-article", { detail: article })
  );
}

// ── Carousel card ─────────────────────────────────────────────────────────────
function DealCard({ deal }: { deal: (typeof LANDMARK_DEALS)[number] }) {
  return (
    <button
      className="group block text-left w-full rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ft-teal"
      onClick={() => openBriefing(deal)}
    >
      <div className="relative h-[27rem] overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deal.image}
          alt={deal.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          {/* Sector + Year badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold tracking-widest uppercase bg-ft-teal/90 px-2 py-0.5 rounded-sm">
              {deal.sector}
            </span>
            <span className="text-xs font-semibold bg-ft-red/80 px-2 py-0.5 rounded-sm">
              {deal.value}
            </span>
            <span className="text-xs text-white/60 ml-auto">{deal.year}</span>
          </div>

          {/* Headline */}
          <h3 className="font-display text-xl font-bold leading-snug mb-2 group-hover:text-ft-mint transition-colors">
            {deal.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/75 leading-relaxed line-clamp-2 mb-4">
            {deal.description}
          </p>

          {/* CTA */}
          <div className="flex items-center text-sm font-semibold text-ft-mint group-hover:underline">
            Read analysis
            <ArrowRight
              size={16}
              className="ml-2 transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </button>
  );
}

// ── LandmarkDeals section ─────────────────────────────────────────────────────
export default function LandmarkDeals() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    update();
    carouselApi.on("select", update);
    return () => { carouselApi.off("select", update); };
  }, [carouselApi]);

  return (
    <section className="bg-ft-cream py-12 border-t border-ft-border">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-ft-black">
              Landmark Deals of the Last Decade
            </h2>
            <p className="text-sm text-ft-muted mt-2">
              The defining transactions that shaped modern markets
            </p>
          </div>
          <div className="hidden md:flex gap-2 shrink-0">
            <button
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full border border-ft-border bg-white text-ft-black hover:bg-ft-grey transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Previous"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full border border-ft-border bg-white text-ft-black hover:bg-ft-grey transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Next"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Full-bleed carousel */}
      <Carousel
        setApi={setCarouselApi}
        opts={{ align: "start", dragFree: true }}
      >
        <CarouselContent className="ml-[max(1.5rem,calc(50vw-640px))]">
          {LANDMARK_DEALS.map((deal) => (
            <CarouselItem
              key={deal.id}
              className="max-w-[320px] pl-5 lg:max-w-[360px]"
            >
              <DealCard deal={deal} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="mt-6 flex justify-center gap-2">
        {LANDMARK_DEALS.map((_, i) => (
          <button
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              currentSlide === i ? "bg-ft-black" : "bg-ft-border"
            }`}
            onClick={() => carouselApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
