import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGHLContact } from "./ghl";

describe("createGHLContact", () => {
  const originalEnv = process.env;
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GHL_API_KEY: "test-api-key",
      GHL_LOCATION_ID: "test-location-id",
    };
    globalThis.fetch = mockFetch;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("environment guard", () => {
    it("returns null when GHL_API_KEY is missing", async () => {
      delete process.env.GHL_API_KEY;
      const result = await createGHLContact({ name: "John", email: "j@test.com" });
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("GHL credentials not configured, skipping GHL sync");
    });

    it("returns null when GHL_LOCATION_ID is missing", async () => {
      delete process.env.GHL_LOCATION_ID;
      const result = await createGHLContact({ name: "John", email: "j@test.com" });
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("name parsing", () => {
    beforeEach(() => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contact: { id: "abc" } }),
      });
    });

    it("splits 'John Doe' into firstName and lastName", async () => {
      await createGHLContact({ name: "John Doe", email: "j@test.com" });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.firstName).toBe("John");
      expect(body.lastName).toBe("Doe");
    });

    it("handles single name with no lastName", async () => {
      await createGHLContact({ name: "Madonna", email: "m@test.com" });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.firstName).toBe("Madonna");
      expect(body.lastName).toBeUndefined();
    });

    it("handles multi-part name correctly", async () => {
      await createGHLContact({ name: "Mary Jane Watson", email: "m@test.com" });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.firstName).toBe("Mary");
      expect(body.lastName).toBe("Jane Watson");
    });

    it("trims whitespace from names", async () => {
      await createGHLContact({ name: "  John   Doe  ", email: "j@test.com" });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.firstName).toBe("John");
      expect(body.lastName).toBe("Doe");
    });
  });

  describe("payload construction", () => {
    beforeEach(() => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contact: { id: "abc" } }),
      });
    });

    it("includes phone and companyName when provided", async () => {
      await createGHLContact({
        name: "John",
        email: "j@test.com",
        phone: "(555) 123-4567",
        company: "SimCo",
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.phone).toBe("(555) 123-4567");
      expect(body.companyName).toBe("SimCo");
    });

    it("omits phone and companyName when empty or undefined", async () => {
      await createGHLContact({
        name: "John",
        email: "j@test.com",
        phone: "",
        company: undefined,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).not.toHaveProperty("phone");
      expect(body).not.toHaveProperty("companyName");
    });
  });

  describe("API response handling", () => {
    it("returns parsed JSON on successful response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contact: { id: "abc123" } }),
      });
      const result = await createGHLContact({ name: "John", email: "j@test.com" });
      expect(result).toEqual({ contact: { id: "abc123" } });
    });

    it("returns null and logs error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => "Duplicate contact",
      });
      const result = await createGHLContact({ name: "John", email: "j@test.com" });
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith("GHL API error:", 422, "Duplicate contact");
    });
  });

  describe("fetch configuration", () => {
    it("sends POST to correct URL with auth headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contact: { id: "abc" } }),
      });
      await createGHLContact({ name: "John", email: "j@test.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://services.leadconnectorhq.com/contacts/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
            Version: "2021-07-28",
          }),
        })
      );
    });
  });
});
