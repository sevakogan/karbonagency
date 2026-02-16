import { ImageResponse } from "next/og";

export const alt =
  "Open a Sim Racing Center — Turnkey Consulting by Karbon Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ConsultingOGImage() {
  const steps = [
    "Find Location",
    "Sign Lease",
    "Build Rigs",
    "Hire Staff",
    "Launch Marketing",
    "Go Live",
  ];

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
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0505 25%, #0a0a0a 50%, #0f0a1a 75%, #0a0a0a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Top bar — logo + badge */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 60,
            right: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg viewBox="0 0 32 32" fill="none" width="44" height="44">
              <path
                d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
                fill="url(#og-c-grad)"
                stroke="url(#og-c-grad)"
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
                <linearGradient
                  id="og-c-grad"
                  x1="3"
                  y1="1"
                  x2="29"
                  y2="31"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ef4444" />
                  <stop offset="1" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-0.01em",
                }}
              >
                KARBON
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                AGENCY
              </span>
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(249,115,22,0.35)",
              background: "rgba(249,115,22,0.1)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "#fb923c",
              }}
            >
              Turnkey Consulting
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Open a Sim Racing
          </h1>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 20,
              background: "linear-gradient(90deg, #ef4444, #f97316)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Center
          </h1>

          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
              maxWidth: 650,
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 36,
            }}
          >
            We build it. You own it. Location, rigs, staff, marketing — everything handled.
          </p>
        </div>

        {/* Step pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 800,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.25)",
              fontWeight: 600,
            }}
          >
            karbonagency.com/consulting
          </span>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.25)",
              fontWeight: 600,
            }}
          >
            100% Yours — We Don&apos;t Own or Operate
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
