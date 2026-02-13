import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "./contact-form";

// Helper to get form fields by their id (more reliable than label matching
// since the SMS consent label contains words like "Message" and "phone")
function getField(id: string) {
  return document.getElementById(id) as HTMLElement;
}

describe("ContactForm", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  describe("rendering", () => {
    it("renders all form fields and submit button", () => {
      render(<ContactForm />);

      expect(getField("name")).toBeInTheDocument();
      expect(getField("company")).toBeInTheDocument();
      expect(getField("phone")).toBeInTheDocument();
      expect(getField("email")).toBeInTheDocument();
      expect(getField("message")).toBeInTheDocument();
      expect(getField("sms-consent")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Get My Free Strategy Call/i })).toBeInTheDocument();
    });

    it("renders submit button in enabled state initially", () => {
      render(<ContactForm />);
      const button = screen.getByRole("button", { name: /Get My Free Strategy Call/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("successful submission", () => {
    it("sends form data and shows success message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, id: 1 }),
      });

      render(<ContactForm />);

      await user.type(getField("name"), "John Doe");
      await user.type(getField("phone"), "555-1234");
      await user.type(getField("email"), "john@test.com");
      await user.type(getField("message"), "Hello");
      await user.click(screen.getByRole("button", { name: /Get My Free Strategy Call/i }));

      await waitFor(() => {
        expect(screen.getByText(/We got your message/i)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/contact", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }));
    });
  });

  describe("loading state", () => {
    it("shows Sending text and disables button while submitting", async () => {
      const user = userEvent.setup();
      // Create a promise that won't resolve immediately
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValue(pendingPromise);

      render(<ContactForm />);

      await user.type(getField("name"), "John");
      await user.type(getField("phone"), "123");
      await user.type(getField("email"), "j@t.com");
      await user.type(getField("message"), "Hi");
      await user.click(screen.getByRole("button", { name: /Get My Free Strategy Call/i }));

      expect(screen.getByRole("button", { name: /Sending/i })).toBeDisabled();

      // Cleanup: resolve the pending promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  describe("API error", () => {
    it("displays server error message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, message: "Invalid email" }),
      });

      render(<ContactForm />);

      await user.type(getField("name"), "John");
      await user.type(getField("phone"), "123");
      await user.type(getField("email"), "j@t.com");
      await user.type(getField("message"), "Hi");
      await user.click(screen.getByRole("button", { name: /Get My Free Strategy Call/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email")).toBeInTheDocument();
      });
    });

    it("displays generic error when no message provided", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      });

      render(<ContactForm />);

      await user.type(getField("name"), "John");
      await user.type(getField("phone"), "123");
      await user.type(getField("email"), "j@t.com");
      await user.type(getField("message"), "Hi");
      await user.click(screen.getByRole("button", { name: /Get My Free Strategy Call/i }));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });
    });
  });

  describe("network error", () => {
    it("displays failed to send message when fetch throws", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      render(<ContactForm />);

      await user.type(getField("name"), "John");
      await user.type(getField("phone"), "123");
      await user.type(getField("email"), "j@t.com");
      await user.type(getField("message"), "Hi");
      await user.click(screen.getByRole("button", { name: /Get My Free Strategy Call/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to send. Please try again.")).toBeInTheDocument();
      });
    });
  });
});
