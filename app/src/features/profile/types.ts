import type { AuthUser } from "../auth/types";

export interface ProfileGame extends Record<string, unknown> {
  id?: string;
  gameId?: string;
  name?: string;
  gameUsername?: string;
  platform?: string;
  platforms?: string[];
  skillLevel?: string;
  rank?: string;
  nickname?: string;
  game?: { id?: string; name?: string } | null;
  rankData?: { rank?: string } | null;
}

export interface ProfileSkill extends Record<string, unknown> {
  id?: string;
  name?: string;
  level?: string;
  endorsements?: number;
  endorsementCount?: number;
  hasEndorsed?: boolean;
}

export interface PlayerProfile extends AuthUser {
  username: string;
  shareable?: boolean;
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
  personalInfo?: {
    fullName?: string;
    location?: string;
    profession?: string;
    gender?: string;
    age?: number;
    phone?: string;
  };
  socialMedia?: Array<{
    id?: string;
    platform?: string;
    url?: string;
    username?: string;
  }>;
  gamingAccounts?: Array<{
    id?: string;
    platform?: string;
    url?: string;
    username?: string;
  }>;
  gamesPlayed?: ProfileGame[];
  games?: ProfileGame[];
  skills?: ProfileSkill[];
  needs?: Array<{
    id?: string;
    title?: string;
    type?: string;
    game?: string;
    description?: string;
    active?: boolean;
    createdAt?: string;
  }>;
  teams?: ProfileTeam[];
  achievements?: Array<{
    id?: string;
    title?: string;
    description?: string;
    points?: number;
    isCompleted?: boolean;
    category?: string;
    achievementId?: string;
  }>;
  milestones?: Array<{
    id?: string;
    title?: string;
    description?: string;
    date?: string;
    createdAt?: string;
    type?: "achievement" | "event" | "career" | "status" | "other" | string;
    icon?: string;
  }>;
  tournaments?: ProfileTournament[];
  stats?: {
    wins?: number;
    losses?: number;
    matchesPlayed?: number;
    winRate?: number;
    ranking?: number;
    rankingScore?: number;
    tournamentWins?: number;
  };
}

export type ProfileTab = "info" | "career" | "games" | "matches" | "posts" | "achievements";

export interface ProfileTeam {
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  role?: string;
  logo?: string;
  level?: string;
  region?: string;
  members?: Array<{
    userId?: string;
    title?: string;
    role?: string;
    joinedAt?: string;
    user?: { id?: string };
  }>;
  stats?: { tournamentWins?: number };
  team?: { id?: string; slug?: string; name?: string; logo?: string };
}

export interface ProfileTournament {
  id?: string;
  name?: string;
  title?: string;
  game?: string | { name?: string };
  date?: string;
  placement?: number | null;
  totalParticipants?: number;
  prizePool?: string | number;
  organizer?: string;
  url?: string;
  status?: "upcoming" | "completed";
  tournament?: {
    id?: string;
    name?: string;
    game?: string;
    organizer?: string;
    prizePool?: string | number;
  };
}

export interface PlayerConnection {
  id: string;
  username: string;
  profileImage?: string;
  gamerTitle?: string;
  isOnline?: boolean;
}
export interface ConnectionPage {
  data: PlayerConnection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface ReferralEntry {
  userId: string;
  username: string;
  profileImage?: string;
  joinedAt: string;
  status?: string;
  rewardPoints?: number;
}
export interface ReferralPage {
  referralCode: string;
  totalReferrals: number;
  referrals: ReferralEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface GameOption {
  id: string;
  name: string;
  gameType?: string;
}
export interface GamesPage {
  data: GameOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface GameRanking {
  game?: ProfileGame | string | null;
  gameId?: string;
  rankingScore?: number;
  rank?: number | string;
}
export interface MatchHistoryEntry extends Record<string, unknown> {
  id?: string;
  game?: string | { name?: string };
  opponent?: string;
  result?: string;
  score?: string;
  status?: string;
  scheduledDate?: string;
  date?: string;
  createdAt?: string;
}
export interface Endorser extends PlayerConnection {
  endorsedAt?: string;
  timestamp?: string;
}
export interface EndorserPage {
  data: Endorser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  badge?: { imageUrl?: string; color?: string };
  progress?: { current: number; required: number; percentage: number } | null;
  completed: boolean;
  completedAt?: string | null;
  rewardsClaimed: boolean;
}
export interface AchievementsSummary {
  totalPoints: number;
  completedCount: number;
  totalCount: number;
  achievements: AchievementItem[];
}
export interface SalaryComponent {
  factor: string;
  rawValue: number;
  weight: number;
  normalizedScore: number;
  contributionUSD: number;
}
export interface SalaryEstimation {
  userId: string;
  estimate: number;
  min: number;
  max: number;
  currency: string;
  tier: string;
  estimatedMonthlyGLK: number;
  confidenceScore: number;
  factorScore: number;
  components: SalaryComponent[];
  benchmarks?: {
    percentile?: number;
    avgSalaryInTier?: number;
    comparisonToAverage?: string;
  };
  improvementSuggestions: string[];
  lastCalculated: string;
  isVerified: boolean;
}
export interface SalaryHistoryItem {
  id: string;
  estimate: number;
  tier: string;
  factorScore: number;
  calculatedAt: string;
}
