export interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  profileImage?: string;
  role?: string;
}

export function hasAdminRole(user: Pick<AdminUser, "role"> | null | undefined) {
  return user?.role?.toLowerCase() === "admin";
}
