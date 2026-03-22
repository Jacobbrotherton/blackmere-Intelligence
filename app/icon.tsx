import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#FDF6EC",
          border: "2px solid #1A1A1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#1A1A1A",
            lineHeight: 1,
          }}
        >
          BI
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#C0392B",
              marginLeft: 1,
              marginBottom: 4,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
