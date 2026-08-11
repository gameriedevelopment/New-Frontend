export type LeaderboardEntityType = "users" | "teams";
export type LeaderboardMetric =
  "ranking" | "wins" | "winRate" | "tournamentWins" | "matches" | "challenges";

export interface LeaderboardStats {
  rankingScore?: number;
  ranking?: number;
  wins: number;
  losses: number;
  draws: number;
  tournamentWins: number;
  matchesPlayed: number;
  winRate: number;
}

export interface LeaderboardEntity {
  id: string;
  entityType: LeaderboardEntityType;
  username?: string;
  name?: string;
  slug?: string;
  profileImage?: string;
  logo?: string;
  gamerTitle?: string;
  gameLevel?: string;
  level?: string;
  region?: string;
  games: Array<{ id?: string; name: string }>;
  stats: LeaderboardStats;
  challengeCount: number;
}

export interface LeaderboardPageData {
  data: LeaderboardEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeaderboardFilters {
  type: LeaderboardEntityType;
  metric: LeaderboardMetric;
  game?: string;
}
