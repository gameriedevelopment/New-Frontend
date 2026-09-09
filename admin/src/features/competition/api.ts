import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type {
  AdminAchievementInput,
  AdminAchievementQuery,
  AdminAchievementRecord,
  AdminChallengeQuery,
  AdminChallengeRecord,
  CreateAdminChallengeInput,
  AdminTournamentInput,
  AdminTournamentQuery,
  AdminTournamentRecord,
  UpdateAdminChallengeInput,
} from "./types";

export async function getAdminChallenges(query: AdminChallengeQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminChallengeRecord>>>(
    "/admin/challenges",
    { params: query },
  );
  return data.data;
}

export async function saveAdminChallenge(
  id: string | undefined,
  input: CreateAdminChallengeInput | UpdateAdminChallengeInput,
) {
  const request = id
    ? api.patch<ApiEnvelope<AdminChallengeRecord>>(`/admin/challenges/${id}`, input)
    : api.post<ApiEnvelope<AdminChallengeRecord>>("/admin/challenges", input);
  return (await request).data.data;
}

export async function deleteAdminChallenge(id: string, reason: string) {
  await api.delete(`/admin/challenges/${id}`, { data: { reason } });
}

export async function getAdminTournaments(query: AdminTournamentQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminTournamentRecord>>>(
    "/admin/tournaments",
    { params: query },
  );
  return data.data;
}

function tournamentForm(input: AdminTournamentInput) {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (key === "file") return;
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  if (input.file) form.append("file", input.file);
  return form;
}

export async function saveAdminTournament(id: string | undefined, input: AdminTournamentInput) {
  const request = id
    ? api.patch<ApiEnvelope<AdminTournamentRecord>>(
        `/admin/tournaments/${id}`,
        tournamentForm(input),
      )
    : api.post<ApiEnvelope<AdminTournamentRecord>>("/admin/tournaments", tournamentForm(input));
  return (await request).data.data;
}

export async function deleteAdminTournament(id: string, reason: string) {
  await api.delete(`/admin/tournaments/${id}`, { data: { reason } });
}

export async function getAdminAchievements(query: AdminAchievementQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminAchievementRecord>>>(
    "/admin/achievements",
    { params: query },
  );
  return data.data;
}

export async function saveAdminAchievement(id: string | undefined, input: AdminAchievementInput) {
  const request = id
    ? api.patch<ApiEnvelope<AdminAchievementRecord>>(`/admin/achievements/${id}`, input)
    : api.post<ApiEnvelope<AdminAchievementRecord>>("/admin/achievements", input);
  return (await request).data.data;
}

export async function deleteAdminAchievement(id: string, reason: string) {
  await api.delete(`/admin/achievements/${id}`, { data: { reason } });
}
