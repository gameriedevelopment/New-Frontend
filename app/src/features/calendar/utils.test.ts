import { describe, expect, it } from "vitest";
import { dayKey, monthCells, monthRange, shiftMonth, zonedDateTimeToIso } from "./utils";

describe("calendar timezone helpers", () => {
  it("converts a wall-clock time in Lagos to UTC", () => {
    expect(zonedDateTimeToIso("2026-08-11T10:30", "Africa/Lagos")).toBe("2026-08-11T09:30:00.000Z");
  });
  it("keeps month navigation stable over year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("builds a six-week Monday-first month grid", () => {
    const cells = monthCells("2026-08");
    expect(cells).toHaveLength(42);
    expect(cells[0]).toBe("2026-07-27");
  });
  it("creates timezone-correct month boundaries", () => {
    const range = monthRange("2026-08", "Africa/Lagos");
    expect(range.startDate).toBe("2026-07-31T23:00:00.000Z");
    expect(dayKey(range.startDate, "Africa/Lagos")).toBe("2026-08-01");
  });
  it("rejects a wall-clock time skipped by daylight saving", () => {
    expect(() => zonedDateTimeToIso("2026-03-08T02:30", "America/New_York")).toThrow();
  });
});
