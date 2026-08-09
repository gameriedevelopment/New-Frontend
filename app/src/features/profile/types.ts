import type { AuthUser } from "../auth/types";

export interface ProfileGame extends Record<string, unknown> {
  id?: string;
  name?: string;
  gameUsername?: string;
  platform?: string;
  platforms?: string[];
  skillLevel?: string;
  rank?: string;
  game?: { id?: string; name?: string } | null;
  rankData?: { rank?: string } | null;
}

export interface ProfileSkill extends Record<string, unknown> {
  id?: string;
  name?: string;
  level?: string;
  endorsements?: number;
  endorsementCount?: number;
}

export interface PlayerProfile extends AuthUser {
  username: string;
  profileVisibility?: "public" | "private" | "friends" | string;
  backgroundImage?: string;
  gamerTitle?: string;
  gameLevel?: string;
  bio?: string;
  region?: string;
  dateOfBirth?: string;
  platforms?: string[];
  followersCount?: number;
  followers?: unknown[];
  following?: unknown[];
  isFollowedByCurrentUser?: boolean;
  personalInfo?: { fullName?: string; location?: string; profession?: string; gender?: string; age?: number; phone?: string };
  socialMedia?: Array<{ id?: string; platform?: string; url?: string; username?: string }>;
  gamingAccounts?: Array<{ id?: string; platform?: string; url?: string; username?: string }>;
  gamesPlayed?: ProfileGame[];
  games?: ProfileGame[];
  skills?: ProfileSkill[];
  needs?: Array<{ id?: string; title?: string; type?: string; description?: string }>;
  teams?: Array<{ id?: string; name?: string; title?: string; role?: string; team?: { id?: string; name?: string } }>;
  achievements?: Array<{ id?: string; title?: string; description?: string; points?: number; isCompleted?: boolean; category?: string }>;
  milestones?: Array<{ id?: string; title?: string; description?: string; date?: string; createdAt?: string }>;
  tournaments?: Array<{ id?: string; name?: string; title?: string; placement?: number; date?: string }>;
  stats?: { wins?: number; losses?: number; matchesPlayed?: number; winRate?: number; ranking?: number; rankingScore?: number };
}

export type ProfileTab = "info" | "career" | "games" | "matches" | "posts" | "achievements";
