import { ImageResponse } from "next/og";

export const alt = "Karbon Agency - Meta & Instagram Ads for Sim Racing, F1 Simulators, Drift Racing, and Motorsport Venues";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0505 30%, #0f0a1a 60%, #0a0a0a 100%)",
          position: "relative",
        }}
      >
        {/* Subtle gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          }}
        />

        {/* K Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" width="80" height="80">
            <path
              d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
              fill="url(#og-grad)"
              stroke="url(#og-grad)"
              strokeWidth="0.5"
            />
            <path
              d="M11 8V24M11 16L21 8M11 16L21 24"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="og-grad" x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            KARBON
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "-0.02em",
            }}
          >
            AGENCY
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            borderRadius: 999,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.1)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              background: "linear-gradient(90deg, #ef4444, #f97316)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            The Only Agency of Its Kind
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Meta & Instagram Ads Built Exclusively for
          Sim Racing Businesses
        </p>

        {/* Bottom keyword bar */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          {["F1 Simulators", "Drift Racing", "Motorsport Venues", "Racing Arcades", "Esports Racing"].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.2)",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
