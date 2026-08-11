import type { DirectoryQuery } from "../../lib/contracts";

export interface PlatformAdminQuery extends DirectoryQuery {}

export interface PlatformAdminMember {
  id: string;
  userId: string;
  email: string;
  username?: string | null;
  profileImage?: string | null;
  status: "active" | "suspended";
  isSuperAdmin: boolean;
  isProtected: boolean;
  invitedByEmail?: string | null;
  lastActiveAt?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

export interface PlatformAdminInvite {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  invitedByEmail?: string | null;
  createdAt: string;
}

export interface AdminInviteDetails {
  email: string;
  requiresPassword: boolean;
  invitedByEmail?: string | null;
}
