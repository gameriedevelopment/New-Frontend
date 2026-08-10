export type ChallengeType = "user" | "team";
export type ChallengeStatus = "pending" | "accepted" | "rejected" | "completed" | "expired";
export type ChallengeScope = "for-you" | "team" | "history";
export type ChallengeDirection = "all" | "received" | "sent";

export interface ChallengeResult {
  winnerId: string;
  score: string;
  notes?: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  challengerId?: string;
  challengerName?: string;
  challengedId?: string;
  challengedName?: string;
  challengerTeamId?: string;
  challengerTeamName?: string;
  challengedTeamId?: string;
  challengedTeamName?: string;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number;
  tokenAmount?: number;
  stakes?: string;
  message?: string;
  status: ChallengeStatus;
  result?: ChallengeResult;
  initiatedBy?: string;
  createdAt?: string;
}

export interface ChallengePageData {
  data: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ChallengeFilters {
  scope: ChallengeScope;
  direction: ChallengeDirection;
  status?: ChallengeStatus | "all";
  searchTerm?: string;
}

export interface CreateChallengePayload {
  type: ChallengeType;
  challengedId?: string;
  challengedTeamId?: string;
  challengerTeamId?: string;
  game: string;
  scheduledDate: string;
  format: string;
  teamSize?: number;
  tokenAmount?: number;
  stakes?: string;
  message?: string;
}
