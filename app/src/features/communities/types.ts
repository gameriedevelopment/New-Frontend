export interface CommunityGame {
  id?: string;
  name: string;
  platforms?: string[];
}
export interface CommunityUser {
  id: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  gamerTitle?: string;
  isOnline?: boolean;
}
export interface CommunityMember {
  id?: string;
  userId?: string;
  role?: string;
  title?: string;
  joinedAt?: string;
  isActive?: boolean;
  user?: CommunityUser;
}
export interface ViewerRelationship {
  isOwner: boolean;
  isMember: boolean;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  role: string | null;
  title: string | null;
  canManage: boolean;
}
export interface CompetitionItem {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  date?: string;
  createdAt?: string;
}
export interface TeamSummary {
  id: string;
  ownerId?: string;
  name: string;
  slug?: string;
  logo?: string;
  backgroundImage?: string;
  description?: string;
  region?: string;
  country?: string;
  timezone?: string;
  level?: string;
  teamMessage?: string;
  platforms?: string[];
  games?: CommunityGame[];
  members?: CommunityMember[];
  followers?: CommunityUser[];
  membersCount?: number;
  followersCount?: number;
  stats?: {
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    winRate?: number;
    tournamentWins?: number;
    ranking?: number;
  };
  achievements?: CompetitionItem[];
  tournaments?: CompetitionItem[];
  milestones?: CompetitionItem[];
  viewerRelationship?: ViewerRelationship;
}
export interface HubSummary {
  id: string;
  ownerId?: string;
  name: string;
  slug?: string;
  logo?: string;
  backgroundImage?: string;
  description?: string;
  region?: string;
  country?: string;
  timezone?: string;
  type?: string;
  visibility?: string;
  joinPolicy?: string;
  organizationName?: string;
  vatNumber?: string;
  platforms?: string[];
  games?: CommunityGame[];
  members?: CommunityMember[];
  teams?: TeamSummary[];
  followers?: CommunityUser[];
  membersCount?: number;
  teamsCount?: number;
  followersCount?: number;
  restricted?: boolean;
  viewerRelationship?: ViewerRelationship;
}
export interface CommunityInvite<T extends TeamSummary | HubSummary> {
  id: string;
  message?: string;
  createdAt?: string;
  team?: T;
  hub?: T;
}
export interface TeamRequestSummary {
  id: string;
  userId?: string;
  message?: string;
  status?: string;
  direction?: "request" | "invite";
  createdAt?: string;
  user?: CommunityUser;
}
export interface TeamFollowerPage {
  items: CommunityUser[];
  total: number;
  page: number;
  totalPages: number;
}
export interface TeamGameRanking {
  id?: string;
  game: CommunityGame | string;
  rankingScore?: number;
  rank?: number;
  rankData?: { tier?: string; division?: string };
}
export interface HubRequestSummary {
  id: string;
  message?: string;
  status?: string;
  direction?: "request" | "invite";
  createdAt?: string;
  user?: CommunityUser;
  hub?: HubSummary;
}
export interface HubTeamRequestSummary {
  id: string;
  message?: string;
  status?: string;
  direction?: "request" | "invite";
  createdAt?: string;
  team?: TeamSummary;
  requestedBy?: CommunityUser;
}
export interface HubPendingInvites {
  userIds: string[];
  teamIds: string[];
  users: HubRequestSummary[];
  teams: HubTeamRequestSummary[];
}
export interface HubDashboard {
  community: {
    members: number;
    followers: number;
    teams: number;
    posts: number;
  };
  referral: {
    code: string | null;
    totalSignups: number;
    verifiedUsers: number;
    completedProfiles: number;
  };
  growth: { memberGrowth: Array<{ date: string; count: number }> };
}
export interface DirectoryPage<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
export interface CommunityFilters {
  search?: string;
  type?: string;
  level?: string;
  region?: string;
  game?: string;
}
export interface CommunityFormPayload {
  name: string;
  description?: string;
  country?: string;
  region?: string;
  timezone?: string;
  platforms?: string[];
  games?: Array<{ id: string; name: string; platforms: string[] }>;
  level?: string;
  teamMessage?: string;
  type?: "community" | "organization";
  visibility?: "public" | "private";
  joinPolicy?: "open" | "request";
  organizationName?: string;
  vatNumber?: string;
}
export interface CommunityMediaFiles {
  logo?: File;
  background?: File;
}
export interface TeamWalletBalance {
  id?: string;
  tokenId?: string;
  amount?: number | string;
  token?: { symbol?: string; name?: string };
}
export interface TeamWalletSummary {
  id: string;
  teamId: string;
  address?: string;
  balances?: TeamWalletBalance[];
  reservedBalances?: Record<string, { amount: number | string; expiresAt?: string }>;
}
export interface TeamWalletInsights {
  flows: {
    totalInflow: number;
    totalOutflow: number;
    totalReserved: number;
    totalReleased: number;
    netFlow: number;
  };
  sourceBreakdown: Array<{ name: string; value: number }>;
  monthlyTrends: Array<{ month: string; inflow: number; outflow: number; reserved: number }>;
  challengeMetrics: Array<{
    challengeId: string;
    reserved: number;
    released: number;
    status: string;
  }>;
}
export type TeamWalletTransactionType =
  "INCOMING" | "OUTGOING" | "TRANSFER" | "CHALLENGE_RESERVE" | "CHALLENGE_RELEASE";
export type TeamWalletTransactionStatus = "PENDING" | "COMPLETED" | "FAILED";
export interface TeamWalletTransaction {
  id: string;
  teamId: string;
  type: TeamWalletTransactionType;
  amount: number | string;
  status: TeamWalletTransactionStatus;
  initiatedBy?: string;
  timestamp: string;
  createdAt?: string;
  metadata?: {
    challengeId?: string;
    description?: string;
    commission?: number;
    recipientTeamId?: string;
    recipientUserId?: string;
    senderTeamId?: string;
    transferAmount?: number;
  };
}
export interface TeamWalletTransactionFilters {
  type?: TeamWalletTransactionType;
  status?: TeamWalletTransactionStatus;
}
export interface TeamWalletTransactionPage {
  data: TeamWalletTransaction[];
  total: number;
  totalPages: number;
  page: number;
}
