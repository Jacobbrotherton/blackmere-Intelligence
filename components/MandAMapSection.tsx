"use client";

import { useState } from "react";
import { WorldMap } from "@/components/ui/map";
import { Maximize2, X } from "lucide-react";

const MA_DOTS = [
  // Microsoft (Redmond, WA) → Activision (Santa Monica, CA) [$68.7bn]
  {
    start: { lat: 47.674, lng: -122.121, label: "Microsoft ($68.7bn)" },
    end: { lat: 34.019, lng: -118.491, label: "Activision" },
  },
  // Pfizer (New York) → Seagen (Bothell, WA) [$43bn]
  {
    start: { lat: 40.750, lng: -73.990, label: "Pfizer ($43bn)" },
    end: { lat: 47.762, lng: -122.205, label: "Seagen" },
  },
  // ExxonMobil (Spring, TX) → Pioneer Natural Resources (Irving, TX) [$59.5bn]
  {
    start: { lat: 30.080, lng: -95.417, label: "ExxonMobil ($59.5bn)" },
    end: { lat: 32.814, lng: -96.948, label: "Pioneer" },
  },
  // JPMorgan (New York) → First Republic (San Francisco) [$10.6bn]
  {
    start: { lat: 40.713, lng: -74.006, label: "JPMorgan ($10.6bn)" },
    end: { lat: 37.775, lng: -122.419, label: "First Republic" },
  },
  // Amazon (Seattle) → MGM (Beverly Hills) [$8.5bn]
  {
    start: { lat: 47.606, lng: -122.332, label: "Amazon ($8.5bn)" },
    end: { lat: 34.073, lng: -118.400, label: "MGM" },
  },
  // Broadcom (San Jose) → VMware (Palo Alto) [$61bn]
  {
    start: { lat: 37.338, lng: -121.886, label: "Broadcom ($61bn)" },
    end: { lat: 37.442, lng: -122.143, label: "VMware" },
  },
  // AstraZeneca (Cambridge, UK) → Alexion (Boston, MA) [$39bn]
  {
    start: { lat: 52.205, lng: 0.122, label: "AstraZeneca ($39bn)" },
    end: { lat: 42.360, lng: -71.059, label: "Alexion" },
  },
  // LVMH (Paris) → Tiffany (New York) [$15.8bn]
  {
    start: { lat: 48.857, lng: 2.352, label: "LVMH ($15.8bn)" },
    end: { lat: 40.763, lng: -73.975, label: "Tiffany" },
  },
  // SoftBank (Tokyo) → ARM (Cambridge, UK) [$32bn]
  {
    start: { lat: 35.676, lng: 139.650, label: "SoftBank ($32bn)" },
    end: { lat: 52.205, lng: 0.122, label: "ARM" },
  },
  // Saudi Aramco (Dhahran) → Sabic (Riyadh) [$69bn]
  {
    start: { lat: 26.314, lng: 50.137, label: "Saudi Aramco ($69bn)" },
    end: { lat: 24.714, lng: 46.675, label: "Sabic" },
  },
  // BHP (Melbourne) → OZ Minerals (Adelaide) [$9.6bn]
  {
    start: { lat: -37.814, lng: 144.963, label: "BHP ($9.6bn)" },
    end: { lat: -34.929, lng: 138.601, label: "OZ Minerals" },
  },
  // UnitedHealth (Minnetonka, MN) → Change Healthcare (Nashville) [$13.8bn]
  {
    start: { lat: 44.921, lng: -93.469, label: "UnitedHealth ($13.8bn)" },
    end: { lat: 36.163, lng: -86.782, label: "Change Healthcare" },
  },
];

export default function MandAMapSection() {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <section className="mt-10 border-t border-ft-border pt-8 pb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ft-black">
            M&amp;A Global Activity
          </h2>
          <p className="text-sm text-ft-muted mt-1">
            Live cross-border deal connections
          </p>
        </div>
        <button
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-ft-teal border border-ft-teal px-3 py-1.5 hover:bg-ft-teal hover:text-white transition-colors rounded-sm shrink-0"
        >
          <Maximize2 size={12} />
          View Full Map
        </button>
      </div>

      <WorldMap dots={MA_DOTS} lineColor="#CC0000" />

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-8"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-2 text-sm font-medium"
            >
              <X size={18} />
              Close
            </button>
            <WorldMap dots={MA_DOTS} lineColor="#CC0000" />
          </div>
        </div>
      )}
    </section>
  );
}
