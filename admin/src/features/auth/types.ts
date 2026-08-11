export interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  profileImage?: string;
  role?: string;
  adminStatus?: "active" | "suspended";
  isSuperAdmin?: boolean;
}

export function hasAdminRole(user: Pick<AdminUser, "role"> | null | undefined) {
  return user?.role?.toLowerCase() === "admin";
}
