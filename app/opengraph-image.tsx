import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#FDF6EC",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "#FDF6EC",
            border: "6px solid #1A1A1A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              fontFamily: "serif",
              fontSize: 70,
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1,
            }}
          >
            BI
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#C0392B",
                marginLeft: 3,
                marginTop: 12,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#1A1A1A",
              letterSpacing: 5,
            }}
          >
            BLACKMERE
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "serif",
            fontSize: 52,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          BLACKMERE INTELLIGENCE
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 22,
            color: "#555",
            letterSpacing: 4,
            textAlign: "center",
          }}
        >
          M&A DEAL TRACKER · MERGERS · ACQUISITIONS · DIVESTITURES
        </div>

        {/* Bottom border stripe */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 8,
            background: "#1A1A1A",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
