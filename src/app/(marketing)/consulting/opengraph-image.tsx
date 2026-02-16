import { ImageResponse } from "next/og";
import {
  loadInterFonts,
  OgBackground,
  OgHeader,
  OgDivider,
  OgFooter,
  OgPill,
} from "@/lib/og-utils";

export const alt =
  "Open a Sim Racing Center — Turnkey Consulting by Karbon Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ConsultingOGImage() {
  const fonts = await loadInterFonts();

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
            "linear-gradient(145deg, #0a0a0a 0%, #1a0505 20%, #0d0d0d 45%, #0f0a1a 70%, #0a0a0a 100%)",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <OgBackground />

        <OgHeader
          badgeText="Turnkey Consulting"
          badgeColor="orange"
          gradientId="og-c-grad"
        />

        {/* Main headline with text glow */}
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
              fontFamily: "Inter",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 4,
              textShadow:
                "0 0 60px rgba(239,68,68,0.3), 0 0 120px rgba(249,115,22,0.12)",
            }}
          >
            Open a Sim Racing
          </h1>
          <h1
            style={{
              fontSize: 64,
              fontFamily: "Inter",
              fontWeight: 900,
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: 14,
              background: "linear-gradient(90deg, #ef4444, #f97316)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Center
          </h1>

          <p
            style={{
              fontSize: 21,
              fontFamily: "Inter",
              fontWeight: 300,
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
              maxWidth: 620,
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 24,
            }}
          >
            We build it. You own it. Location, rigs, staff, marketing —
            everything handled.
          </p>
        </div>

        <OgDivider />

        {/* Step pills with timeline connector */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 820,
          }}
        >
          {steps.map((step, i) => (
            <OgPill key={step} index={i}>
              {step}
            </OgPill>
          ))}
        </div>

        <OgFooter
          domain="karbonagency.com/consulting"
          tagline="100% Yours — We Don't Own or Operate"
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
