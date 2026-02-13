import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  createContactSubmission: vi.fn(),
  createLead: vi.fn(),
}));
vi.mock("@/lib/ghl", () => ({
  createGHLContact: vi.fn(),
}));

import { POST } from "./route";
import { createContactSubmission, createLead } from "@/lib/db";
import { createGHLContact } from "@/lib/ghl";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createContactSubmission).mockResolvedValue(42);
    vi.mocked(createGHLContact).mockResolvedValue({ contact: { id: "ghl-1" } });
    vi.mocked(createLead).mockResolvedValue("lead-uuid-1");
  });

  describe("validation", () => {
    it("returns 400 when name is missing", async () => {
      const res = await POST(makeRequest({ email: "a@b.com", phone: "123", message: "hi" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain("required");
    });

    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ name: "John", phone: "123", message: "hi" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when phone is empty", async () => {
      const res = await POST(makeRequest({ name: "John", email: "a@b.com", phone: "", message: "hi" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when message is missing", async () => {
      const res = await POST(makeRequest({ name: "John", email: "a@b.com", phone: "123" }));
      expect(res.status).toBe(400);
    });
  });

  describe("successful submission", () => {
    const validBody = {
      name: "John Doe",
      email: "john@test.com",
      phone: "555-1234",
      message: "Hello there",
    };

    it("returns 200 with success and Supabase id", async () => {
      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true, id: 42 });
    });

    it("prepends company to message when provided", async () => {
      await POST(makeRequest({ ...validBody, company: "SimCo" }));
      expect(createContactSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "[SimCo] Hello there",
        })
      );
      expect(createGHLContact).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "SimCo",
        })
      );
    });

    it("calls Supabase, GHL, and lead creation in parallel", async () => {
      await POST(makeRequest(validBody));
      expect(createContactSubmission).toHaveBeenCalledTimes(1);
      expect(createGHLContact).toHaveBeenCalledTimes(1);
      expect(createLead).toHaveBeenCalledTimes(1);
    });

    it("creates a lead with correct data", async () => {
      await POST(makeRequest(validBody));
      expect(createLead).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@test.com",
        phone: "555-1234",
        company: undefined,
        source: "website",
        notes: "Hello there",
      });
    });
  });

  describe("error handling", () => {
    it("returns 500 when createContactSubmission throws", async () => {
      vi.mocked(createContactSubmission).mockRejectedValue(new Error("DB down"));
      const res = await POST(
        makeRequest({
          name: "John",
          email: "j@t.com",
          phone: "123",
          message: "hi",
        })
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Failed to submit");
    });
  });
});
