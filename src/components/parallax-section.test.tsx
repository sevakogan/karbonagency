import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ParallaxSection from "./parallax-section";

describe("ParallaxSection", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener");
    removeSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    render(
      <ParallaxSection>
        <p>Hello parallax</p>
      </ParallaxSection>
    );
    expect(screen.getByText("Hello parallax")).toBeInTheDocument();
  });

  it("sets willChange: transform on the wrapper", () => {
    const { container } = render(
      <ParallaxSection>
        <span>Test</span>
      </ParallaxSection>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.willChange).toBe("transform");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ParallaxSection className="my-parallax">
        <span>Test</span>
      </ParallaxSection>
    );
    expect(container.firstChild).toHaveClass("my-parallax");
  });

  it("registers a scroll listener on mount", () => {
    render(
      <ParallaxSection>
        <span>Test</span>
      </ParallaxSection>
    );
    const scrollCalls = addSpy.mock.calls.filter(
      (call) => call[0] === "scroll"
    );
    expect(scrollCalls.length).toBeGreaterThanOrEqual(1);
    // passive flag should be set
    expect(scrollCalls[0][2]).toEqual({ passive: true });
  });

  it("removes the scroll listener on unmount", () => {
    const { unmount } = render(
      <ParallaxSection>
        <span>Test</span>
      </ParallaxSection>
    );
    unmount();
    const removeCalls = removeSpy.mock.calls.filter(
      (call) => call[0] === "scroll"
    );
    expect(removeCalls.length).toBeGreaterThanOrEqual(1);
  });
});
