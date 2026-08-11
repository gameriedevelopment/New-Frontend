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

export async function setAdminTeamBan(teamId: string, ban: boolean) {
  await api.patch(`/admin/teams/${teamId}/ban`, { ban });
}

export async function deleteAdminTeam(teamId: string) {
  await api.delete(`/admin/teams/${teamId}`);
}
