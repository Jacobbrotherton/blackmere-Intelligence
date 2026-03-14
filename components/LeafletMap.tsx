"use client";

// Vanilla Leaflet via useEffect — no react-leaflet, no SSR conflicts.
// Leaflet CSS is loaded in app/layout.tsx as a <link> tag.
import { useEffect, useRef } from "react";
import type { Map as LMap } from "leaflet";

export interface ArticleSummary {
  title: string;
  url: string;
  sourceName: string;
  timeAgoStr: string;
  dealValue: string | null;
  sector: string;
}

export interface CompanyMarker {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  articles: ArticleSummary[];
}

export interface DealConnection {
  from: [number, number];
  to: [number, number];
}

interface Props {
  markers: CompanyMarker[];
  connections: DealConnection[];
}

function buildPopupHtml(m: CompanyMarker): string {
  const arts = m.articles.slice(0, 4);
  const dealCount = m.articles.length;

  const rows = arts
    .map(
      (a) => `
      <a href="/deal?url=${encodeURIComponent(a.url)}"
         style="display:block;margin-bottom:8px;text-decoration:none;color:inherit;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
          <span style="color:#990F3D;font-size:9px;font-weight:700;
                       text-transform:uppercase;letter-spacing:.06em;">
            ${a.sector}
          </span>
          ${
            a.dealValue
              ? `<span style="background:#0D7680;color:#fff;font-size:9px;
                              padding:1px 4px;border-radius:2px;">${a.dealValue}</span>`
              : ""
          }
        </div>
        <div style="color:#1A1A1A;font-size:12px;font-weight:600;line-height:1.35;">
          ${a.title.length > 80 ? a.title.slice(0, 80) + "…" : a.title}
        </div>
        <div style="color:#807060;font-size:10px;margin-top:2px;">
          ${a.sourceName} · ${a.timeAgoStr}
        </div>
      </a>`
    )
    .join("");

  return `
    <div style="font-family:'Source Sans 3',system-ui,sans-serif;
                font-size:13px;min-width:240px;max-width:280px;">
      <div style="border-bottom:1px solid #E6D9CE;
                  padding-bottom:6px;margin-bottom:8px;">
        <div style="font-weight:700;font-size:14px;color:#1A1A1A;">
          ${m.displayName}
        </div>
        <div style="color:#807060;font-size:11px;">${m.city}</div>
      </div>
      ${
        dealCount === 0
          ? `<p style="color:#807060;font-size:11px;">No live deals found.</p>`
          : `<div style="color:#807060;font-size:10px;font-weight:700;
                         text-transform:uppercase;letter-spacing:.08em;
                         margin-bottom:6px;">
               ${dealCount} related deal${dealCount !== 1 ? "s" : ""}
             </div>${rows}`
      }
    </div>`;
}

export default function LeafletMap({ markers, connections }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);

  // Keep latest props accessible inside the one-time effect closure
  const markersRef = useRef(markers);
  const connectionsRef = useRef(connections);
  markersRef.current = markers;
  connectionsRef.current = connections;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    // Dynamic import ensures Leaflet's browser globals are never touched
    // during server-side rendering
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [25, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Positron — clean, minimal tiles, no API key needed
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Draw deal connection polylines
      connectionsRef.current.forEach(({ from, to }) => {
        L.polyline([from, to], {
          color: "#0D7680",
          weight: 1.5,
          opacity: 0.45,
          dashArray: "5 4",
        }).addTo(map);
      });

      // Custom FT-teal dot icon — avoids broken default icon paths in webpack
      const makeDotIcon = (hasDeals: boolean) => {
        const color = hasDeals ? "#0D7680" : "#807060";
        const size = hasDeals ? 14 : 10;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;background:${color};
            border-radius:50%;border:2px solid #fff;
            box-shadow:0 0 0 2px ${color},0 2px 6px rgba(0,0,0,.25);
          "></div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -(size / 2 + 4)],
        });
      };

      // Add company markers with HTML popups
      markersRef.current.forEach((m) => {
        L.marker([m.lat, m.lng], { icon: makeDotIcon(m.articles.length > 0) })
          .bindPopup(buildPopupHtml(m), { maxWidth: 300, minWidth: 260 })
          .addTo(map);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Initialise once; data is captured via markersRef/connectionsRef

  return (
    <div
      ref={containerRef}
      style={{ height: "300px", width: "100%" }}
      className="rounded-sm border border-ft-border"
    />
  );
}
