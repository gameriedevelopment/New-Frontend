import type { DirectoryQuery } from "../../lib/contracts";

export type AdminChallengeStatus = "pending" | "accepted" | "rejected" | "completed" | "expired";

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
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number | null;
  stakes?: string | null;
  tokenAmount?: number | null;
  status: AdminChallengeStatus;
  reportCount: number;
  lastReportedAt?: string | null;
  result?: { winnerId: string; score: string; notes?: string } | null;
  initiatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
