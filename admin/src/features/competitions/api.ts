import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminChallengeQuery, AdminChallengeRecord } from "./types";

export async function getAdminChallenges(query: AdminChallengeQuery = {}) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminChallengeRecord>>>(
    "/admin/challenges",
    { params: query },
  );
  return data.data;
}
