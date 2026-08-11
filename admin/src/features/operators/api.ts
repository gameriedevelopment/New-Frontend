import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type {
  AdminInviteDetails,
  PlatformAdminInvite,
  PlatformAdminMember,
  PlatformAdminQuery,
} from "./types";

export async function getPlatformAdmins(query: PlatformAdminQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<PlatformAdminMember>>>("/admin/operators", {
    params: query,
  });
  return data.data;
}

export async function getPlatformAdminInvites(query: PlatformAdminQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<PlatformAdminInvite>>>(
    "/admin/operator-invites",
    { params: query },
  );
  return data.data;
}

export async function invitePlatformAdmin(email: string) {
  await api.post("/admin/operators/invite", { email });
}

export async function updatePlatformAdmin(
  id: string,
  status: PlatformAdminMember["status"],
  reason: string,
) {
  await api.patch(`/admin/operators/${id}`, { status, reason });
}

export async function removePlatformAdmin(id: string, reason: string) {
  await api.delete(`/admin/operators/${id}`, { data: { reason } });
}

export async function resendPlatformAdminInvite(id: string) {
  await api.post(`/admin/operator-invites/${id}/resend`);
}

export async function revokePlatformAdminInvite(id: string) {
  await api.delete(`/admin/operator-invites/${id}`);
}

export async function getAdminInviteDetails(token: string) {
  const { data } = await api.get<ApiEnvelope<AdminInviteDetails>>("/admin-invites/lookup", {
    params: { token },
  });
  return data.data;
}

export async function acceptAdminInvite(input: {
  token: string;
  password?: string;
  username?: string;
  fullName?: string;
}) {
  await api.post("/admin-invites/accept", input);
}
