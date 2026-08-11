import type { LeaderboardEntity, LeaderboardEntityType, LeaderboardMetric } from "./types";

export const leaderboardMetrics: Array<{
  value: LeaderboardMetric;
  label: string;
  shortLabel: string;
}> = [
  { value: "ranking", label: "Overall score", shortLabel: "Overall" },
  { value: "wins", label: "Match wins", shortLabel: "Wins" },
  { value: "winRate", label: "Win rate", shortLabel: "Win rate" },
  { value: "tournamentWins", label: "Tournament wins", shortLabel: "Tournaments" },
  { value: "matches", label: "Matches played", shortLabel: "Matches" },
  { value: "challenges", label: "Challenges played", shortLabel: "Challenges" },
];

export function leaderboardName(entity: LeaderboardEntity): string {
  return entity.entityType === "users"
    ? entity.username || "Gamerie player"
    : entity.name || "Gamerie team";
}

export function leaderboardSubtitle(entity: LeaderboardEntity): string {
  return entity.entityType === "users"
    ? entity.gamerTitle || entity.gameLevel || "Player"
    : entity.level || "Team";
}

export function leaderboardPath(entity: LeaderboardEntity): string {
  if (entity.entityType === "users")
    return `/profile/${encodeURIComponent(entity.username || entity.id)}`;
  const slug =
    entity.slug ||
    (entity.name || entity.id)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `/teams/${encodeURIComponent(slug)}`;
}

export function leaderboardImage(entity: LeaderboardEntity): string | undefined {
  return entity.entityType === "users" ? entity.profileImage : entity.logo;
}

export function metricValue(entity: LeaderboardEntity, metric: LeaderboardMetric): number {
  const stats = entity.stats;
  const values: Record<LeaderboardMetric, number> = {
    ranking:
      entity.entityType === "users" ? Number(stats.rankingScore ?? 0) : Number(stats.ranking ?? 0),
    wins: Number(stats.wins ?? 0),
    winRate: Number(stats.winRate ?? 0),
    tournamentWins: Number(stats.tournamentWins ?? 0),
    matches: Number(stats.matchesPlayed ?? 0),
    challenges: Number(entity.challengeCount ?? 0),
  };
  return Number.isFinite(values[metric]) ? values[metric] : 0;
}

export function formatMetricValue(entity: LeaderboardEntity, metric: LeaderboardMetric): string {
  const value = metricValue(entity, metric);
  return metric === "winRate"
    ? `${Math.round(value)}%`
    : new Intl.NumberFormat().format(Math.round(value));
}

export function entityTypeLabel(type: LeaderboardEntityType): string {
  return type === "users" ? "players" : "teams";
}
