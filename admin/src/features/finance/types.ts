import type { DirectoryQuery } from "../../lib/contracts";

export interface FinanceSummary {
  purchases: { currency: string; fiatAmount: string; glkAmount: string; count: number }[];
  personalTransactionCount: number;
  teamTransactionCount: number;
  userCommissionsGlk: string;
  teamCommissionsGlk: string;
  totalCommissionsGlk: string;
  monthlyCommissions: { month: string; amount: string }[];
}

export interface WalletFlowPoint {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface LedgerRecord {
  id: string;
  scope: "personal" | "team";
  ownerId: string;
  owner: string;
  type: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount: string;
  unit: string;
  purchasedGlk: string | null;
  commission: string;
  createdAt: string;
}

export interface LedgerQuery extends DirectoryQuery {
  scope?: "personal" | "team";
  status?: "PENDING" | "COMPLETED" | "FAILED";
  type?: string;
}

export interface ReferralCodeRecord {
  id: string;
  code: string;
  source: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  signups: number;
  rewarded: number;
}

export interface ReferralQuery extends DirectoryQuery {
  status?: "active" | "inactive" | "expired";
}

export interface ReferralInput {
  code: string;
  source: string;
  expiresAt?: string;
  reason: string;
}

export interface ReferralSignupRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  profileImage: string | null;
  status: "pending" | "qualified" | "rewarded" | "rejected";
  rewardPoints: number;
  createdAt: string;
}
