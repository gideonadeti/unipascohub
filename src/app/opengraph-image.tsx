import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Uni Pasco Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0c0a09",
        color: "#fafaf9",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Uni Pasco Hub
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a8a29e",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.4,
          }}
        >
          Find and share past exam papers to prepare with confidence.
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
