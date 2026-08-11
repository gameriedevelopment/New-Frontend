import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminHubQuery, AdminHubRecord, AdminTeamQuery, AdminTeamRecord } from "./types";

export async function getAdminTeams(query: AdminTeamQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminTeamRecord>>>("/admin/teams", {
    params: query,
  });
  return data.data;
}

export async function getAdminHubs(query: AdminHubQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminHubRecord>>>("/admin/hubs", {
    params: query,
  });
  return data.data;
}

export async function setAdminTeamBan(teamId: string, ban: boolean, reason: string) {
  await api.patch(`/admin/teams/${teamId}/ban`, { ban, reason });
}

export async function setAdminHubBan(hubId: string, ban: boolean, reason: string) {
  await api.patch(`/admin/hubs/${hubId}/ban`, { ban, reason });
}

export async function deleteAdminTeam(teamId: string, reason: string) {
  await api.delete(`/admin/teams/${teamId}`, { data: { reason } });
}
