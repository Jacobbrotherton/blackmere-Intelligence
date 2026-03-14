"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  animationDuration?: number;
  loop?: boolean;
  onDotClick?: (label: string) => void;
  containerClassName?: string;
}

export function WorldMap({
  dots = [],
  lineColor = "#CC0000",
  animationDuration = 2,
  loop = true,
  onDotClick,
  containerClassName = "",
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  // Only hover needs a re-render — everything else lives in a ref
  const [hoveredDot, setHoveredDot] = useState<{
    index: number;
    type: "start" | "end";
  } | null>(null);

  // Single ref for all navigation state — zero re-renders for pan/zoom
  const nav = useRef({
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    dragDist: 0,
  });

  const applyTransform = () => {
    const el = transformRef.current;
    if (!el) return;
    const { zoom, panX, panY } = nav.current;
    el.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clamp pan so the user can never scroll to empty space
    const clampPan = (s: typeof nav.current, W: number, H: number) => {
      s.panX = Math.min(0, Math.max(W * (1 - s.zoom), s.panX));
      s.panY = Math.min(0, Math.max(H * (1 - s.zoom), s.panY));
    };

    // Wheel: zoom toward the cursor so the point under the mouse stays fixed
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = nav.current;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      // MIN_ZOOM=1 ensures the full world map is always visible
      const newZoom = Math.max(1, Math.min(7, s.zoom * factor));
      const ratio = newZoom / s.zoom;
      // Keep the content point under the cursor fixed in container space
      s.panX = mx - (mx - s.panX) * ratio;
      s.panY = my - (my - s.panY) * ratio;
      s.zoom = newZoom;
      clampPan(s, rect.width, rect.height);
      applyTransform();
    };

    const onMouseDown = (e: MouseEvent) => {
      const s = nav.current;
      s.dragging = true;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.startPanX = s.panX;
      s.startPanY = s.panY;
      s.dragDist = 0;
      container.style.cursor = "grabbing";
      e.preventDefault();
    };

    // Attach move + up to window so dragging works even if cursor leaves the box
    const onMouseMove = (e: MouseEvent) => {
      const s = nav.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      s.dragDist = Math.sqrt(dx * dx + dy * dy);
      s.panX = s.startPanX + dx;
      s.panY = s.startPanY + dy;
      const { width: W, height: H } = container.getBoundingClientRect();
      clampPan(s, W, H);
      applyTransform();
    };

    const onMouseUp = () => {
      nav.current.dragging = false;
      container.style.cursor = "grab";
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── Map background ─────────────────────────────────────────────────────────
  const map = useMemo(() => new DottedMap({ height: 100, grid: "diagonal" }), []);
  const svgMap = useMemo(
    () =>
      map.getSVG({
        radius: 0.22,
        color: "#00000025",
        shape: "circle",
        backgroundColor: "#FAF7F2",
      }),
    [map]
  );

  const projectPoint = (lat: number, lng: number) => ({
    x: (lng + 180) * (800 / 360),
    y: (90 - lat) * (400 / 180),
  });

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full aspect-[2/1] rounded-sm relative font-sans overflow-hidden border border-ft-border select-none",
        containerClassName
      )}
      style={{ backgroundColor: "#FAF7F2", cursor: "grab", overscrollBehavior: "none", touchAction: "none" }}
    >
      {/* Single transformable layer — dot-map background + SVG overlay move together */}
      <div
        ref={transformRef}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none object-cover absolute inset-0"
          alt="world map"
          height={495}
          width={1056}
          draggable={false}
          priority
          unoptimized
        />

        <svg
          viewBox="0 0 800 400"
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Animated arcs ── */}
          {dots.map((dot, i) => {
            const sp = projectPoint(dot.start.lat, dot.start.lng);
            const ep = projectPoint(dot.end.lat, dot.end.lng);
            const path = createCurvedPath(sp, ep);
            const t0 = (i * staggerDelay) / fullCycleDuration;
            const t1 = (i * staggerDelay + animationDuration) / fullCycleDuration;
            const tR = totalAnimationTime / fullCycleDuration;

            return (
              <g key={`arc-${i}`}>
                <motion.path
                  d={path}
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                  transition={
                    loop
                      ? { duration: fullCycleDuration, times: [0, t0, t1, tR, 1], ease: "easeInOut", repeat: Infinity }
                      : { duration: animationDuration, delay: i * staggerDelay, ease: "easeInOut" }
                  }
                />
                {loop && (
                  <motion.circle
                    r="3"
                    fill={lineColor}
                    initial={{ offsetDistance: "0%", opacity: 0 }}
                    animate={{ offsetDistance: [null, "0%", "100%", "100%", "100%"], opacity: [0, 0, 1, 0, 0] }}
                    transition={{ duration: fullCycleDuration, times: [0, t0, t1, tR, 1], ease: "easeInOut", repeat: Infinity }}
                    style={{ offsetPath: `path('${path}')` }}
                  />
                )}
              </g>
            );
          })}

          {/* ── Dots — pointer-events re-enabled per group ── */}
          {dots.map((dot, i) => {
            const sp = projectPoint(dot.start.lat, dot.start.lng);
            const ep = projectPoint(dot.end.lat, dot.end.lng);
            const startHov = hoveredDot?.index === i && hoveredDot.type === "start";
            const endHov = hoveredDot?.index === i && hoveredDot.type === "end";

            const labelStyle: React.CSSProperties = {
              fontSize: "10px", fontWeight: 700, lineHeight: "22px",
              padding: "0 7px", background: "white", color: "#1a1a1a",
              border: "1px solid #D4C5A9", borderRadius: "2px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)", whiteSpace: "nowrap",
            };

            return (
              <g key={`dots-${i}`} style={{ pointerEvents: "auto" }}>
                {/* ── Start dot ── */}
                <g
                  onMouseEnter={() => setHoveredDot({ index: i, type: "start" })}
                  onMouseLeave={() => setHoveredDot(null)}
                  onClick={() => { if (nav.current.dragDist < 5) onDotClick?.(dot.start.label ?? ""); }}
                  style={{ cursor: onDotClick ? "pointer" : "default" }}
                  transform={startHov
                    ? `translate(${sp.x},${sp.y}) scale(1.4) translate(${-sp.x},${-sp.y})`
                    : undefined}
                >
                  {/* Outer hover ring — only visible on hover */}
                  {startHov && (
                    <circle cx={sp.x} cy={sp.y} r="9" fill="none"
                      stroke={lineColor} strokeWidth="1.5" opacity="0.55" />
                  )}
                  {/* Invisible enlarged hit area */}
                  <circle cx={sp.x} cy={sp.y} r="10" fill="transparent" />
                  {/* Solid dot — slightly larger on hover */}
                  <circle cx={sp.x} cy={sp.y} r={startHov ? "4" : "3"} fill={lineColor} filter="url(#dot-glow)" />
                  {/* Pulse ring — hidden on hover to keep it clean */}
                  {!startHov && (
                    <circle cx={sp.x} cy={sp.y} r="3" fill={lineColor} opacity="0.4">
                      <animate attributeName="r" from="3" to="11" dur="2s" begin="0s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin="0s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* Start label — only while hovered, outside transform group */}
                {startHov && dot.start.label && (
                  <foreignObject x={sp.x - 72} y={sp.y - 30} width="144" height="22"
                    style={{ overflow: "visible", pointerEvents: "none" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={labelStyle}>{dot.start.label}</span>
                    </div>
                  </foreignObject>
                )}

                {/* ── End dot ── */}
                <g
                  onMouseEnter={() => setHoveredDot({ index: i, type: "end" })}
                  onMouseLeave={() => setHoveredDot(null)}
                  onClick={() => { if (nav.current.dragDist < 5) onDotClick?.(dot.end.label ?? ""); }}
                  style={{ cursor: onDotClick ? "pointer" : "default" }}
                  transform={endHov
                    ? `translate(${ep.x},${ep.y}) scale(1.4) translate(${-ep.x},${-ep.y})`
                    : undefined}
                >
                  {endHov && (
                    <circle cx={ep.x} cy={ep.y} r="9" fill="none"
                      stroke={lineColor} strokeWidth="1.5" opacity="0.55" />
                  )}
                  <circle cx={ep.x} cy={ep.y} r="10" fill="transparent" />
                  <circle cx={ep.x} cy={ep.y} r={endHov ? "4" : "3"} fill={lineColor} filter="url(#dot-glow)" />
                  {!endHov && (
                    <circle cx={ep.x} cy={ep.y} r="3" fill={lineColor} opacity="0.4">
                      <animate attributeName="r" from="3" to="11" dur="2s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* End label — only while hovered, outside transform group */}
                {endHov && dot.end.label && (
                  <foreignObject x={ep.x - 72} y={ep.y - 30} width="144" height="22"
                    style={{ overflow: "visible", pointerEvents: "none" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={labelStyle}>{dot.end.label}</span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 right-2 text-[10px] text-ft-muted/50 pointer-events-none select-none" style={{ zIndex: 1 }}>
        scroll to zoom · drag to pan
      </div>
    </div>
  );
}
