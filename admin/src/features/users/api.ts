import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminUserQuery, AdminUserRecord } from "./types";

export async function getAdminUsers(query: AdminUserQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminUserRecord>>>("/admin/users", {
    params: query,
  });
  return data.data;
}

export async function setAdminUserBan(userId: string, ban: boolean, reason: string) {
  await api.patch(`/admin/users/${userId}/ban`, { ban, reason });
}

export async function deleteAdminUser(userId: string, reason: string) {
  await api.delete(`/admin/users/${userId}`, { data: { reason } });
}
