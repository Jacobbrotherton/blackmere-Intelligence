"use client";

const ITEMS = [
  { label: "Deals YTD", value: "+12%", up: true },
  { label: "Global Value", value: "$1.4T", up: true },
  { label: "US Deals", value: "-3%", up: false },
  { label: "Europe Deals", value: "+8%", up: true },
  { label: "Asia-Pacific", value: "+21%", up: true },
  { label: "Avg Premium", value: "+34%", up: true },
  { label: "PE Buyouts", value: "-6%", up: false },
  { label: "Cross-Border", value: "+2%", up: true },
  { label: "Hostile Bids", value: "+31%", up: true },
  { label: "Avg Deal Size", value: "$291m", up: true },
  { label: "Tech M&A", value: "+44%", up: true },
  { label: "Healthcare", value: "+17%", up: true },
];

// Duplicate for seamless infinite loop
const DOUBLED = [...ITEMS, ...ITEMS];

export default function TickerBar() {
  return (
    <div className="bg-ft-black text-white text-xs py-2 overflow-hidden select-none">
      <div className="ticker-track">
        {DOUBLED.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mr-10">
            <span className="text-gray-400 tracking-wide">{item.label}</span>
            <span className={item.up ? "ticker-badge-up" : "ticker-badge-down"}>
              {item.value}
            </span>
            <span className="text-gray-700 ml-2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
