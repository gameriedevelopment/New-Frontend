import { describe, expect, it } from "vitest";
import { getTransferBreakdown } from "./utils";

describe("wallet transfer breakdown", () => {
  it("matches the backend fee semantics", () => {
    expect(getTransferBreakdown(100, 500)).toEqual({
      valid: true,
      fee: 2,
      received: 98,
      remaining: 400,
    });
    expect(getTransferBreakdown(49, 500).fee).toBe(0);
  });

  it("rejects empty, negative, and unavailable amounts", () => {
    expect(getTransferBreakdown(0, 500).valid).toBe(false);
    expect(getTransferBreakdown(-1, 500).valid).toBe(false);
    expect(getTransferBreakdown(501, 500).valid).toBe(false);
  });
});
