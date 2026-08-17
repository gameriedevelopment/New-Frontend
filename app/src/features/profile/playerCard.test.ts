import { describe, expect, it } from "vitest";
import { buildPlayerCardModel } from "./playerCard";

describe("buildPlayerCardModel", () => {
  it("uses recorded values and labels player-provided versus endorsed skills", () => {
    const model = buildPlayerCardModel({
      id: "player-1",
      username: "nova",
      gamerieId: "GMR42",
      gamerTitle: "In-game leader",
      gamesPlayed: [
        {
          gameUsername: "nova#EU",
          game: { name: "Valorant" },
          rankData: { rank: "Immortal" },
        },
      ],
      stats: { matchesPlayed: 24, winRate: 62.4, rankingScore: 1486 },
      skills: [
        { name: "Leadership", endorsementCount: 4 },
        { name: "Composure", endorsementCount: 0 },
      ],
    });

    expect(model.game).toEqual({
      name: "Valorant",
      identity: "nova#EU",
      standing: "Immortal",
    });
    expect(model.gamerieId).toBe("GMR42");
    expect(model.stats.map((stat) => stat.key)).toEqual(["ranking-score", "win-rate"]);
    expect(model.strengths).toEqual([
      { name: "Leadership", endorsementCount: 4, provenance: "Community endorsed" },
      { name: "Composure", endorsementCount: 0, provenance: "Player listed" },
    ]);
  });

  it("does not invent statistics when no recorded values exist", () => {
    const model = buildPlayerCardModel({ id: "player-1", username: "nova" });
    expect(model.stats).toEqual([]);
    expect(model.strengths).toEqual([]);
    expect(model.title).toBe("Gamerie player");
  });
});
