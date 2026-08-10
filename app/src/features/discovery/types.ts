import type { PlayerProfile } from "../profile/types";

export interface PlayerFilters {
  search?: string;
  gameLevel?: string;
  platform?: string;
  game?: string;
  region?: string;
}

export interface PlayerPage {
  data: PlayerProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SearchKind = "posts" | "players" | "teams" | "games";

export interface SearchPost {
  id: string;
  content: string;
  tags?: string[];
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  createdAt?: string;
}

export interface SearchTeam {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  level?: string;
  members?: Array<{ id: string }>;
  stats?: { tournamentWins?: number };
}

export interface SearchGame {
  id: string;
  name: string;
  banner?: string;
  wallPhoto?: string;
  image?: string;
  genre?: string;
  gameType?: string;
  company?: string;
  description?: string;
  platforms?: string[];
}

export type SearchEntity = SearchPost | PlayerProfile | SearchTeam | SearchGame;

export interface SearchPage<T = SearchEntity> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
