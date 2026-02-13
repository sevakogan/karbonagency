import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Logo from "./logo";

describe("Logo", () => {
  it("renders the SVG icon", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByText("KARBON")).toBeInTheDocument();
    expect(screen.getByText("AGENCY")).toBeInTheDocument();
  });

  it("hides wordmark when showWordmark is false", () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText("KARBON")).not.toBeInTheDocument();
    expect(screen.queryByText("AGENCY")).not.toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { container: smContainer } = render(<Logo size="sm" />);
    const { container: lgContainer } = render(<Logo size="lg" />);

    // sm: icon w-6 h-6
    const smIcon = smContainer.querySelector(".w-6.h-6");
    expect(smIcon).toBeInTheDocument();

    // lg: icon w-10 h-10
    const lgIcon = lgContainer.querySelector(".w-10.h-10");
    expect(lgIcon).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Logo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
