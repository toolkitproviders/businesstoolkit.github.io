import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

export const runtime = "edge";

/**
 * Dynamic Open Graph images: /og?title=Invoice%20Generator
 * Rendered on demand and cached at the edge, so no static assets to maintain.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("title") ?? siteConfig.tagline;
  const title = raw.slice(0, 110);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0a1631 0%, #11224a 55%, #18545c 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#3cbec0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a1631",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ color: "#ffffff", fontSize: 30, fontWeight: 700 }}>
            BusinessToolKit
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 58 : 70,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26 }}>
          <div style={{ color: "#74d8d7" }}>{tools.length} free business tools</div>
          <div style={{ color: "#4675c1" }}>•</div>
          <div style={{ color: "#9bbbe4" }}>No signup required</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
