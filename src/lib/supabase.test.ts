import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreateClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { getAdminSupabase } from "./supabase-admin";

describe("getAdminSupabase", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    };
    mockCreateClient.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calls createClient with env vars", () => {
    const mockClient = { from: vi.fn() };
    mockCreateClient.mockReturnValue(mockClient);

    getAdminSupabase();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-key"
    );
  });

  it("returns the client instance from createClient", () => {
    const mockClient = { from: vi.fn() };
    mockCreateClient.mockReturnValue(mockClient);

    const result = getAdminSupabase();
    expect(result).toBe(mockClient);
  });

  it("creates a new client on each call", () => {
    mockCreateClient.mockReturnValue({ from: vi.fn() });

    getAdminSupabase();
    getAdminSupabase();

    expect(mockCreateClient).toHaveBeenCalledTimes(2);
  });
});
