import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "#FDF6EC",
          border: "8px solid #1A1A1A",
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
            fontSize: 68,
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
            fontSize: 18,
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: 6,
          }}
        >
          BLACKMERE
        </div>
      </div>
    ),
    { ...size }
  );
}
