import { api } from "../../lib/api";
import type {
  Challenge,
  ChallengeFilters,
  ChallengePageData,
  ChallengeType,
  CreateChallengePayload,
} from "./types";

interface Envelope<T> {
  data: T;
}

export async function getMyChallenges(
  filters: ChallengeFilters,
  page = 1,
): Promise<ChallengePageData> {
  const { data } = await api.get<Envelope<ChallengePageData>>("/challenges/mine", {
    params: { ...filters, page, limit: 12, searchTerm: filters.searchTerm || undefined },
  });
  return data.data;
}

export async function getChallenge(id: string): Promise<Challenge> {
  const { data } = await api.get<Envelope<Challenge>>(`/challenges/${id}`);
  return data.data;
}

export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data } = await api.post<Envelope<Challenge>>("/challenges", payload);
  return data.data;
}

export async function updateChallenge(
  id: string,
  type: ChallengeType,
  updates: Partial<Challenge>,
): Promise<Challenge> {
  const { data } = await api.patch<Envelope<Challenge>>(`/challenges/${id}/${type}`, updates);
  return data.data;
}

export async function refreshChallenge(
  id: string,
  type: ChallengeType,
  scheduledDate: string,
): Promise<Challenge> {
  const { data } = await api.patch<Envelope<Challenge>>(`/challenges/${id}/${type}/refresh`, {
    scheduledDate,
  });
  return data.data;
}

export async function proposeReschedule(
  id: string,
  type: ChallengeType,
  scheduledDate: string,
): Promise<Challenge> {
  const { data } = await api.patch<Envelope<Challenge>>(`/challenges/${id}/${type}/reschedule`, {
    scheduledDate,
  });
  return data.data;
}

export async function respondReschedule(
  id: string,
  type: ChallengeType,
  accept: boolean,
): Promise<Challenge> {
  const { data } = await api.patch<Envelope<Challenge>>(
    `/challenges/${id}/${type}/reschedule/respond`,
    { accept },
  );
  return data.data;
}

export async function deleteChallenge(id: string, type: ChallengeType): Promise<void> {
  await api.delete(`/challenges/${id}/${type}`);
}
