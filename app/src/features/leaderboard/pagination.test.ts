import { describe, expect, it } from "vitest";
import { getLeaderboardPageItems } from "./pagination";

describe("leaderboard pagination", () => {
  it("shows every page when the result set is small", () => {
    expect(getLeaderboardPageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the first and last pages available near the beginning", () => {
    expect(getLeaderboardPageItems(3, 12)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 12]);
  });

  it("centres the current page between jump points", () => {
    expect(getLeaderboardPageItems(6, 12)).toEqual([
      1,
      "start-ellipsis",
      5,
      6,
      7,
      "end-ellipsis",
      12,
    ]);
  });

  it("keeps the first and last pages available near the end", () => {
    expect(getLeaderboardPageItems(11, 12)).toEqual([1, "start-ellipsis", 8, 9, 10, 11, 12]);
  });
});
