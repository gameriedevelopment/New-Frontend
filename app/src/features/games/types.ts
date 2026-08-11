export interface Game {
  id: string;
  name: string;
  integrationKey?: string | null;
  wallPhoto?: string | null;
  description?: string;
  company?: string;
  gameType?: string;
  gameModes?: string[];
  requiredSkills?: string[];
  platforms?: string[];
  socialMedia?: Array<{ platform: string; url: string }>;
  officialWebsite?: string;
  followers_stats?: {
    total?: number;
    active_gamers?: number;
    streamers?: number;
    spectators?: number;
  };
}

export interface GameFilters {
  search?: string;
  gameType?: string;
  platform?: string;
  minFollowers?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GameStats {
  teamsCount: number;
  usersCount: number;
}

export interface GameAchievement {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  icon?: string;
  points?: number;
}

export interface ActiveGameUser {
  id: string;
  gameUsername?: string;
  nickname?: string;
  platform?: string;
  platforms?: string[];
  skillLevel?: string;
  hoursPlayed?: number;
  rankData?: {
    rank?: string;
    tier?: string;
    division?: number;
    rankPoints?: number;
  } | null;
  user: {
    id: string;
    username: string;
    gamerTitle?: string;
    profileImage?: string;
    isOnline?: boolean;
    lastSeen?: string;
    activityLevel?: number;
    achievements?: Array<{
      achievementId?: string;
      isCompleted?: boolean;
      achievement?: GameAchievement;
    }>;
    stats?: {
      matchesPlayed?: number;
      wins?: number;
      losses?: number;
      winRate?: number | string;
      rankingScore?: number | string;
      eloRating?: number;
    };
  };
}

export interface ActiveGameTeam {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  region?: string;
  level?: string;
  members?: Array<{ id?: string }>;
  stats?: {
    ranking?: number;
    wins?: number;
    losses?: number;
    winRate?: number | string;
    matchesPlayed?: number;
    tournamentWins?: number;
  };
}

export interface ActiveTeamFilters {
  search?: string;
  region?: string;
  minRanking?: string;
}

export type GridGameKey = "cs2" | "dota-2";

export interface GridSeries {
  id: string;
  startTimeScheduled: string;
  format: string | null;
  tournament: { id: string; name: string } | null;
  teams: Array<{ id: string; name: string }>;
}

export interface GridSeriesResponse {
  totalCount: number;
  series: GridSeries[];
}

export type GameProviderId =
  | "lichess"
  | "clash-royale"
  | "clash-of-clans"
  | "brawl-stars"
  | "league-of-legends"
  | "valorant"
  | "teamfight-tactics"
  | "pubg"
  | "dota-2"
  | "cs2"
  | "steam"
  | "battlenet";

export interface GameConnection {
  id: string;
  provider: GameProviderId;
  providerAccountId: string;
  handle: string | null;
  metadata: Record<string, unknown> | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderMetric {
  label: string;
  value: string | number;
}
