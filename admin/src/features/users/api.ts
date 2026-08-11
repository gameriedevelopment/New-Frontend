import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminUserQuery, AdminUserRecord } from "./types";

export async function getAdminUsers(query: AdminUserQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminUserRecord>>>("/admin/users", {
    params: query,
  });
  return data.data;
}

export async function setAdminUserBan(userId: string, ban: boolean) {
  await api.patch(`/admin/users/${userId}/ban`, { ban });
}

export async function deleteAdminUser(userId: string) {
  await api.delete(`/admin/users/${userId}`);
}
