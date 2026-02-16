import { ImageResponse } from "next/og";
import {
  loadInterFonts,
  OgBackground,
  OgHeader,
  OgDivider,
  OgFooter,
  OgStatCard,
  OgPill,
} from "@/lib/og-utils";

export const alt =
  "Karbon Agency — Meta & Instagram Ads for Sim Racing Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fonts = await loadInterFonts();

  const stats = [
    { value: "$5.03", label: "Cost per Booking" },
    { value: "7.7M+", label: "Impressions", featured: true },
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
            "linear-gradient(145deg, #0a0a0a 0%, #1a0505 20%, #0d0d0d 45%, #0f0a1a 70%, #0a0a0a 100%)",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <OgBackground />

        <OgHeader
          badgeText="The Only Agency of Its Kind"
          badgeColor="red"
          gradientId="og-h-grad"
        />

        {/* Main headline with text glow */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 14,
          }}
        >
          <h1
            style={{
              fontSize: 68,
              fontFamily: "Inter",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              textShadow:
                "0 0 60px rgba(239,68,68,0.3), 0 0 120px rgba(249,115,22,0.12)",
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
              fontFamily: "Inter",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 4,
              textShadow:
                "0 0 60px rgba(239,68,68,0.3), 0 0 120px rgba(249,115,22,0.12)",
            }}
          >
            Seats.
          </h1>
          <p
            style={{
              fontSize: 24,
              fontFamily: "Inter",
              fontWeight: 300,
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              marginBottom: 20,
              letterSpacing: "0.02em",
            }}
          >
            That&apos;s All We Do.
          </p>
        </div>

        <OgDivider />

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {stats.map((stat) => (
            <OgStatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              featured={stat.featured}
            />
          ))}
        </div>

        {/* Service pills */}
        <div style={{ display: "flex", gap: 10 }}>
          {services.map((svc) => (
            <OgPill key={svc}>{svc}</OgPill>
          ))}
        </div>

        <OgFooter
          domain="karbonagency.com"
          tagline="Meta & Instagram Ads for Sim Racing Businesses"
        />
      </div>
    ),
    {
      ...size,
      fonts: fonts.map((f) => ({
        name: f.name,
        data: f.data,
        weight: f.weight,
        style: "normal" as const,
      })),
    },
  );
}
