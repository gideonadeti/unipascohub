import { ImageResponse } from "next/og";

import { siteName, siteTagline } from "@/config/site";

export const runtime = "edge";

export const alt = siteName;
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
        backgroundColor: "#007a55",
        color: "#ecfdf5",
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
          {siteName}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.72)",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.4,
          }}
        >
          {siteTagline}
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
