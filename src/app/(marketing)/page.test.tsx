import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

// Mock ParallaxSection to a simple div passthrough (avoids scroll/RAF issues)
vi.mock("@/components/parallax-section", () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock next/link to a simple anchor
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("Home page", () => {
  it("renders the navbar with logo and Book a Free Call CTA", () => {
    render(<Home />);
    expect(screen.getByText("Book a Free Call")).toBeInTheDocument();
    // Logo renders KARBON wordmark
    expect(screen.getAllByText("KARBON").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the hero headline", () => {
    render(<Home />);
    expect(screen.getByText(/We Fill/)).toBeInTheDocument();
    expect(screen.getByText("Sim Racing")).toBeInTheDocument();
  });

  it("renders all major sections", () => {
    render(<Home />);
    expect(screen.getByText("Sound Familiar?")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText(/Ready to Fill Every/)).toBeInTheDocument();
    expect(screen.getByText("Why Sim Racing Businesses Choose Us")).toBeInTheDocument();
  });

  it("renders footer with links", () => {
    render(<Home />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Request Info")).toBeInTheDocument();
    expect(screen.getByText("(866) 996-META")).toBeInTheDocument();
  });
});
