"use client";

import { useRef, useEffect, ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number; // 0 = no effect, 0.5 = half speed, negative = opposite
  className?: string;
}

export default function ParallaxSection({ children, speed = 0.3, className = "" }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const centerOffset = rect.top + rect.height / 2 - windowHeight / 2;
        const yOffset = centerOffset * speed * -1;
        el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
