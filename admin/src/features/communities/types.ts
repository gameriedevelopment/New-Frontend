import type { DirectoryQuery } from "../../lib/contracts";

export interface AdminTeamQuery extends DirectoryQuery {
  level?: string;
  region?: string;
}

export interface AdminHubQuery extends DirectoryQuery {
  type?: "community" | "organization";
  visibility?: "public" | "private";
  region?: string;
}

export interface AdminTeamRecord {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
  backgroundImage?: string | null;
  description: string;
  country?: string | null;
  region?: string | null;
  timezone?: string | null;
  level?: string | null;
  games?: Array<{ id: string; name: string; platforms: string[] }> | null;
  platforms?: string[] | null;
  ownerId?: string | null;
  stats?: Record<string, number> | null;
  isBanned: boolean;
  reportCount: number;
  lastReportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
}

export interface AdminHubRecord {
  id: string;
  name: string;
  slug?: string | null;
  type: "community" | "organization";
  visibility: "public" | "private";
  joinPolicy: "open" | "request";
  logo?: string | null;
  backgroundImage?: string | null;
  description?: string | null;
  country?: string | null;
  region?: string | null;
  timezone?: string | null;
  organizationName?: string | null;
  games?: Array<{ id: string; name: string; platforms: string[] }> | null;
  ownerId?: string | null;
  reportCount: number;
  lastReportedAt?: string | null;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
  teamsCount?: number;
  followersCount?: number;
}
