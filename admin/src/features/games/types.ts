import type { DirectoryQuery } from "../../lib/contracts";

export interface AdminGameQuery extends DirectoryQuery {
  platform?: string;
  gameType?: string;
}

export interface AdminGameRecord {
  id: string;
  name: string;
  integrationKey?: string | null;
  wallPhoto?: string | null;
  description: string;
  company: string;
  gameType: string;
  gameModes: string[];
  requiredSkills: string[];
  platforms: string[];
  socialMedia?: Array<{ platform: string; url: string }> | null;
  officialWebsite: string;
  followers_stats?: {
    total: number;
    active_gamers: number;
    streamers: number;
    spectators: number;
  } | null;
  usersCount: number;
  teamsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGameInput {
  name: string;
  integrationKey: string;
  description: string;
  company: string;
  gameType: string;
  gameModes: string[];
  requiredSkills: string[];
  platforms: string[];
  officialWebsite: string;
  file?: File | null;
}
