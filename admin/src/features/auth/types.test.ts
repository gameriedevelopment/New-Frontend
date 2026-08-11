import { describe, expect, it } from "vitest";
import { hasAdminRole } from "./types";

describe("hasAdminRole", () => {
  it("accepts only the backend admin role", () => {
    expect(hasAdminRole({ role: "admin" })).toBe(true);
    expect(hasAdminRole({ role: "ADMIN" })).toBe(true);
    expect(hasAdminRole({ role: "user" })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });
});
