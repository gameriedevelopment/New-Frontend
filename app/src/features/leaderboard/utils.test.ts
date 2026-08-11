import { describe, expect, it } from "vitest";
import type { LeaderboardEntity } from "./types";
import { formatMetricValue, leaderboardPath, metricValue } from "./utils";

const player: LeaderboardEntity = {
  id: "user-1",
  entityType: "users",
  username: "nova player",
  games: [],
  challengeCount: 7,
  stats: {
    rankingScore: 82.4,
    wins: 12,
    losses: 4,
    draws: 0,
    tournamentWins: 2,
    matchesPlayed: 16,
    winRate: 75.2,
  },
};

describe("leaderboard metric presentation", () => {
  it("uses the actual challenge count instead of matches", () => {
    expect(metricValue(player, "challenges")).toBe(7);
    expect(metricValue(player, "matches")).toBe(16);
  });

  it("formats win rate as a percentage", () => {
    expect(formatMetricValue(player, "winRate")).toBe("75%");
  });

  it("encodes profile targets", () => {
    expect(leaderboardPath(player)).toBe("/profile/nova%20player");
  });
});
