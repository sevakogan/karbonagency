/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

// ─── Font Loader ─────────────────────────────────────────────
// Fetches Inter Black (900) and Light (300) from Google Fonts CDN

const INTER_BOLD_URL =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuBWYMZg.ttf";
const INTER_LIGHT_URL =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf";

export async function loadInterFonts() {
  const [boldData, lightData] = await Promise.all([
    fetch(INTER_BOLD_URL).then((res) => res.arrayBuffer()),
    fetch(INTER_LIGHT_URL).then((res) => res.arrayBuffer()),
  ]);

  return [
    { name: "Inter", data: boldData, weight: 900 as const },
    { name: "Inter", data: lightData, weight: 300 as const },
  ];
}

// ─── Shared Visual Elements ──────────────────────────────────

/** Dark background with amplified gradient orbs and geometric accents */
export function OgBackground() {
  return (
    <>
      {/* Primary red orb — top right */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -60,
          width: 650,
          height: 650,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 65%)",
        }}
      />
      {/* Orange orb — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: -130,
          left: -80,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 65%)",
        }}
      />
      {/* Warm accent orb — center left */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 300,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Geometric hexagon decoration — top left corner */}
      <div
        style={{
          position: "absolute",
          top: -30,
          left: -30,
          width: 120,
          height: 120,
          borderRadius: 24,
          border: "1px solid rgba(239,68,68,0.08)",
          transform: "rotate(30deg)",
        }}
      />
      {/* Geometric circle — bottom right corner */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: "1px solid rgba(249,115,22,0.06)",
        }}
      />
    </>
  );
}

/** Top bar with Karbon logo + wordmark on left, badge on right */
export function OgHeader({
  badgeText,
  badgeColor = "red",
  gradientId = "og-grad",
}: {
  badgeText: string;
  badgeColor?: "red" | "orange";
  gradientId?: string;
}) {
  const isOrange = badgeColor === "orange";
  const borderColor = isOrange
    ? "rgba(249,115,22,0.4)"
    : "rgba(239,68,68,0.4)";
  const bgColor = isOrange
    ? "rgba(249,115,22,0.12)"
    : "rgba(239,68,68,0.12)";
  const textColor = isOrange ? "#fb923c" : "#f87171";

  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg viewBox="0 0 32 32" fill="none" width="42" height="42">
          <path
            d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
            fill={`url(#${gradientId})`}
            stroke={`url(#${gradientId})`}
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
              id={gradientId}
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
              fontFamily: "Inter",
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
              fontFamily: "Inter",
              fontWeight: 300,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            AGENCY
          </span>
        </div>
      </div>

      {/* Badge pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 20px",
          borderRadius: 999,
          border: `1px solid ${borderColor}`,
          background: bgColor,
          boxShadow: `0 0 20px ${isOrange ? "rgba(249,115,22,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: isOrange ? "#f97316" : "#ef4444",
            boxShadow: `0 0 8px ${isOrange ? "rgba(249,115,22,0.6)" : "rgba(239,68,68,0.6)"}`,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontFamily: "Inter",
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: textColor,
          }}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );
}

/** Gradient accent divider line */
export function OgDivider() {
  return (
    <div
      style={{
        width: 300,
        height: 1,
        background:
          "linear-gradient(90deg, transparent, #ef4444, #f97316, transparent)",
        marginBottom: 24,
      }}
    />
  );
}

/** Bottom footer bar with domain and tagline */
export function OgFooter({
  domain,
  tagline,
}: {
  domain: string;
  tagline: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: "rgba(255,255,255,0.03)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: "Inter",
          color: "rgba(255,255,255,0.3)",
          fontWeight: 900,
        }}
      >
        {domain}
      </span>
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, #ef4444, #f97316)",
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontFamily: "Inter",
          color: "rgba(255,255,255,0.25)",
          fontWeight: 300,
        }}
      >
        {tagline}
      </span>
    </div>
  );
}

/** Glassmorphism stat card */
export function OgStatCard({
  value,
  label,
  featured = false,
}: {
  value: string;
  label: string;
  featured?: boolean;
}) {
  const card = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: featured ? "16px 34px" : "14px 28px",
        borderRadius: 16,
        border: `1px solid ${featured ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.12)"}`,
        background: featured
          ? "rgba(239,68,68,0.08)"
          : "rgba(255,255,255,0.06)",
        boxShadow: featured
          ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(239,68,68,0.15), 0 0 20px rgba(239,68,68,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.3)",
        minWidth: featured ? 180 : 155,
      }}
    >
      <span
        style={{
          fontSize: featured ? 32 : 28,
          fontFamily: "Inter",
          fontWeight: 900,
          background: "linear-gradient(90deg, #ef4444, #f97316)",
          backgroundClip: "text",
          color: "transparent",
          marginBottom: 4,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: 900,
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );

  if (featured) {
    return (
      <div
        style={{
          display: "flex",
          background: "linear-gradient(135deg, #ef4444, #f97316)",
          borderRadius: 17,
          padding: 1,
        }}
      >
        {card}
      </div>
    );
  }

  return card;
}

/** Service / step pill */
export function OgPill({
  children,
  index,
}: {
  children: ReactNode;
  index?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {index !== undefined && (
        <span
          style={{
            fontSize: 13,
            fontFamily: "Inter",
            fontWeight: 900,
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span
        style={{
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: 900,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {children}
      </span>
    </div>
  );
}
