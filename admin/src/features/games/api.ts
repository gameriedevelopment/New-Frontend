import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminGameInput, AdminGameQuery, AdminGameRecord } from "./types";

export async function getAdminGames(query: AdminGameQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminGameRecord>>>("/admin/games", {
    params: query,
  });
  return data.data;
}

function toFormData(input: AdminGameInput) {
  const form = new FormData();
  form.append("name", input.name.trim());
  form.append("description", input.description.trim());
  form.append("company", input.company.trim());
  form.append("gameType", input.gameType.trim());
  form.append("gameModes", JSON.stringify(input.gameModes));
  form.append("requiredSkills", JSON.stringify(input.requiredSkills));
  form.append("platforms", JSON.stringify(input.platforms));
  form.append("officialWebsite", input.officialWebsite.trim());
  if (input.integrationKey.trim()) form.append("integrationKey", input.integrationKey.trim());
  if (input.file) form.append("file", input.file);
  return form;
}

export async function createAdminGame(input: AdminGameInput) {
  const { data } = await api.post<ApiEnvelope<AdminGameRecord>>("/admin/games", toFormData(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function updateAdminGame(gameId: string, input: AdminGameInput) {
  const { data } = await api.patch<ApiEnvelope<AdminGameRecord>>(
    `/admin/games/${gameId}`,
    toFormData(input),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}

export async function deleteAdminGame(gameId: string, reason: string) {
  await api.delete(`/admin/games/${gameId}`, { data: { reason } });
}
