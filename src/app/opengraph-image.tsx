import { ImageResponse } from "next/og";

export const alt =
  "Karbon Agency — Meta & Instagram Ads for Sim Racing Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const stats = [
    { value: "$5.03", label: "Cost per Booking" },
    { value: "7.7M+", label: "Impressions" },
    { value: "20,600+", label: "Bookings" },
  ];

  const services = [
    "Meta Ads",
    "Instagram Ads",
    "Creative Production",
    "Full Funnel Strategy",
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
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 400,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
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
                fill="url(#og-h-grad)"
                stroke="url(#og-h-grad)"
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
                  id="og-h-grad"
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
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.1)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "#f87171",
              }}
            >
              The Only Agency of Its Kind
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <h1
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 0,
            }}
          >
            We Fill{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #ef4444, #f97316)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Sim Racing
            </span>
          </h1>
          <h1
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 6,
            }}
          >
            Seats.
          </h1>
          <p
            style={{
              fontSize: 26,
              fontWeight: 300,
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}
          >
            That&apos;s All We Do.
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                minWidth: 160,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  background: "linear-gradient(90deg, #ef4444, #f97316)",
                  backgroundClip: "text",
                  color: "transparent",
                  marginBottom: 2,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Service pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          {services.map((svc) => (
            <div
              key={svc}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {svc}
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
              color: "rgba(255,255,255,0.2)",
              fontWeight: 600,
            }}
          >
            karbonagency.com
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
              color: "rgba(255,255,255,0.2)",
              fontWeight: 600,
            }}
          >
            Meta &amp; Instagram Ads for Sim Racing Businesses
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
