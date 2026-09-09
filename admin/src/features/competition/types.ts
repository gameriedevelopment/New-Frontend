import type { DirectoryQuery } from "../../lib/contracts";

export type CompetitionView = "tournaments" | "challenges" | "achievements";
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

export type AdminChallengeStatus =
  | "pending"
  | "accepted"
  | "reschedule_pending"
  | "rejected"
  | "cancelled"
  | "completed"
  | "expired";

export interface AdminChallengeQuery extends DirectoryQuery {
  status?: AdminChallengeStatus;
}

export interface AdminChallengeRecord {
  id: string;
  type: "user" | "team";
  challengerId?: string | null;
  challengerName?: string | null;
  challengedId?: string | null;
  challengedName?: string | null;
  challengerTeamId?: string | null;
  challengerTeamName?: string | null;
  challengedTeamId?: string | null;
  challengedTeamName?: string | null;
  eventId?: string | null;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number | null;
  stakes?: string | null;
  tokenAmount?: number | null;
  message?: string | null;
  status: AdminChallengeStatus;
  reportCount: number;
  lastReportedAt?: string | null;
  result?: {
    winnerId: string;
    score: string;
    p1Score?: number;
    p2Score?: number;
    notes?: string;
  } | null;
  initiatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminChallengeInput {
  player1Id: string;
  player2Id: string;
  gameId: string;
  scheduledDate: string;
  format: string;
  message?: string;
}

export interface UpdateAdminChallengeInput {
  game?: string;
  scheduledDate?: string;
  format?: string;
  message?: string;
  status?: AdminChallengeStatus;
  p1Score?: number;
  p2Score?: number;
  winnerId?: string;
  resultNotes?: string;
  reason: string;
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
