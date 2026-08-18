import { describe, expect, it } from "vitest";
import { getMatchPresentation } from "./matchHistory";

describe("getMatchPresentation", () => {
  it("normalizes the structured result returned by production challenges", () => {
    expect(
      getMatchPresentation(
        {
          challengerId: "player-1",
          challengedId: "player-2",
          challengedName: "Predator",
          status: "completed",
          result: { notes: "Final", score: "3–1", winnerId: "player-2" },
        },
        "player-1",
      ),
    ).toEqual({ label: "3–1", state: "loss", opponent: "Predator" });
  });

  it("continues to support legacy string results and scheduled matches", () => {
    expect(getMatchPresentation({ result: "draw", status: "completed" }, "player-1")).toEqual({
      label: "draw",
      state: "draw",
      opponent: null,
    });
    expect(getMatchPresentation({ status: "accepted" }, "player-1")).toEqual({
      label: "accepted",
      state: "accepted",
      opponent: null,
    });
  });
});
