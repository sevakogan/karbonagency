interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", showWordmark = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-sm" },
    md: { icon: "w-8 h-8", text: "text-lg" },
    lg: { icon: "w-10 h-10", text: "text-xl" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* K mark — angular carbon fiber inspired */}
      <div className={`${s.icon} relative`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Hexagonal background */}
          <path
            d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z"
            fill="url(#karbon-gradient)"
            stroke="url(#karbon-gradient)"
            strokeWidth="0.5"
          />
          {/* K letterform */}
          <path
            d="M11 8V24M11 16L21 8M11 16L21 24"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="karbon-gradient" x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showWordmark && (
        <div className="flex items-baseline gap-1.5">
          <span className={`${s.text} font-black tracking-tight text-white`}>
            KARBON
          </span>
          <span className={`${s.text} font-light tracking-tight text-white/50`}>
            AGENCY
          </span>
        </div>
      )}
    </div>
  );
}
