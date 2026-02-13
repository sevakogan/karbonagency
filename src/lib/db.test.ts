import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase-admin module
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

vi.mock("./supabase-admin", () => ({
  getAdminSupabase: () => ({ from: mockFrom }),
}));

import { createContactSubmission } from "./db";

describe("createContactSubmission", () => {
  const testData = {
    name: "John Doe",
    email: "john@test.com",
    phone: "555-1234",
    message: "Hello",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: 42 } });
  });

  it("calls supabase chain correctly", async () => {
    await createContactSubmission(testData);

    expect(mockFrom).toHaveBeenCalledWith("karbon_contact_submissions");
    expect(mockInsert).toHaveBeenCalledWith(testData);
    expect(mockSelect).toHaveBeenCalledWith("id");
    expect(mockSingle).toHaveBeenCalled();
  });

  it("returns the id from the inserted row", async () => {
    mockSingle.mockResolvedValue({ data: { id: 99 } });
    const result = await createContactSubmission(testData);
    expect(result).toBe(99);
  });

  it("passes data through without transformation", async () => {
    const specificData = {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "123-456-7890",
      message: "Test message",
    };
    await createContactSubmission(specificData);
    expect(mockInsert).toHaveBeenCalledWith(specificData);
  });

  it("throws when Supabase returns null data", async () => {
    mockSingle.mockResolvedValue({ data: null });
    await expect(createContactSubmission(testData)).rejects.toThrow();
  });
});
