import type { DirectoryQuery } from "../../lib/contracts";

export type CompetitionView = "tournaments" | "achievements";
export type TournamentStatus = "upcoming" | "ongoing" | "completed";
export type AchievementCategory = "competitor" | "social" | "team" | "challenges" | "tournaments";

export interface AdminTournamentQuery extends DirectoryQuery {
  status?: TournamentStatus;
  game?: string;
}

export interface AdminAchievementQuery extends DirectoryQuery {
  category?: AchievementCategory;
  game?: string;
}

export interface AdminTournamentRecord {
  id: string;
  platform: string;
  platformUrl: string;
  game: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: number;
  format: string;
  teamSize?: number | null;
  currentTeams?: number | null;
  maxTeams?: number | null;
  region?: string | null;
  organizer?: string | null;
  totalParticipants?: number | null;
  skillLevel?: string | null;
  status: TournamentStatus;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAchievementRecord {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  game: string;
  points: number;
  progress: number;
  maxProgress: number;
  icon: string;
  awardedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminTournamentInput = Omit<
  AdminTournamentRecord,
  "id" | "createdAt" | "updatedAt" | "image"
> & { file?: File | null };

export type AdminAchievementInput = Omit<
  AdminAchievementRecord,
  "id" | "awardedCount" | "createdAt" | "updatedAt"
>;
