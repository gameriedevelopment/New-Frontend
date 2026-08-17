import type { DirectoryQuery } from "../../lib/contracts";

export type AdminUserStatus = "active" | "banned";

export interface AdminUserQuery extends DirectoryQuery {
  status?: AdminUserStatus;
}

export interface AdminUserRecord {
  id: string;
  gamerieId?: string | null;
  username: string;
  email: string;
  gamerTitle?: string | null;
  gameLevel?: string | null;
  profileImage?: string | null;
  role: "user" | "admin";
  provider?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  region?: string | null;
  isBanned?: boolean | null;
  reportCount: number;
  lastReportedAt?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  followersCount?: number;
}
