import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "black",
          borderRadius: 36,
        }}
      >
        <svg viewBox="0 0 32 32" fill="none" width="120" height="120">
          <path
            d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
            fill="url(#g)"
            stroke="url(#g)"
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
            <linearGradient id="g" x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    { ...size }
  );
}
