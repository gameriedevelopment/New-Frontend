import { api } from "../../lib/api";
import type {
  AchievementsSummary,
  ConnectionPage,
  EndorserPage,
  GameRanking,
  GamesPage,
  MatchHistoryEntry,
  PlayerProfile,
  ProfileTeam,
  ReferralPage,
  SalaryEstimation,
  SalaryHistoryItem,
} from "./types";
import type { FeedPost } from "../newsfeed/types";

interface ApiEnvelope<T> {
  data: T;
}

export async function getPlayerProfile(identity: string): Promise<PlayerProfile> {
  const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity);
  const endpoint = legacyId
    ? `/users/${identity}`
    : `/users/by-username/${encodeURIComponent(identity)}`;
  const { data } = await api.get<ApiEnvelope<PlayerProfile>>(endpoint);
  return data.data;
}

export async function getPublicPlayerCard(username: string): Promise<PlayerProfile> {
  const { data } = await api.get<ApiEnvelope<PlayerProfile>>(
    `/users/public-card/${encodeURIComponent(username)}`,
  );
  return data.data;
}

export async function getProfileTeams(userId: string): Promise<ProfileTeam[]> {
  const { data } = await api.get<ApiEnvelope<ProfileTeam[]>>(`/teams/user/${userId}`);
  return data.data ?? [];
}

export async function followPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.post(`/users/${currentUserId}/follow/${targetUserId}`);
}

export async function unfollowPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.delete(`/users/${currentUserId}/unfollow/${targetUserId}`);
}

export async function updatePlayerProfile(
  userId: string,
  updates: Partial<PlayerProfile>,
): Promise<PlayerProfile> {
  const { data } = await api.patch<ApiEnvelope<PlayerProfile>>(`/users/${userId}`, updates);
  return data.data;
}

export async function uploadPlayerImage(
  userId: string,
  file: File,
  type: "profileImage" | "backgroundImage",
): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  await api.post(`/users/${userId}/upload/${type}`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function getPlayerConnections(
  userId: string,
  kind: "followers" | "following",
  page: number,
): Promise<ConnectionPage> {
  const { data } = await api.get<ApiEnvelope<ConnectionPage>>(`/users/${kind}/all/${userId}`, {
    params: { page, limit: 20 },
  });
  return data.data;
}

export async function getMyReferrals(page: number): Promise<ReferralPage> {
  const { data } = await api.get<ReferralPage>("/referrals/me", {
    params: { page, limit: 12 },
  });
  return data;
}

export async function searchGameOptions(search: string, page = 1): Promise<GamesPage> {
  const { data } = await api.get<ApiEnvelope<GamesPage>>("/games", {
    params: { search: search || undefined, page, limit: 20 },
  });
  return data.data;
}

export async function getPlayerRankings(userId: string): Promise<GameRanking[]> {
  const { data } = await api.get<ApiEnvelope<GameRanking[]>>(`/users/game-ranks/${userId}`);
  return data.data ?? [];
}
export async function getPlayerMatches(userId: string): Promise<MatchHistoryEntry[]> {
  const { data } = await api.get<ApiEnvelope<MatchHistoryEntry[]>>(`/challenges/user/${userId}`);
  return data.data ?? [];
}
export async function getPlayerPosts(userId: string): Promise<FeedPost[]> {
  const { data } = await api.get<ApiEnvelope<FeedPost[]>>(`/newsfeed/user/${userId}`);
  return data.data ?? [];
}
export async function getSkillEndorsers(
  userId: string,
  skillId: string,
  page: number,
): Promise<EndorserPage> {
  const { data } = await api.get<ApiEnvelope<EndorserPage>>(
    `/users/skill/${skillId}/endorsements`,
    { params: { userId, page, limit: 20 } },
  );
  return data.data;
}
export async function toggleSkillEndorsement(
  endorserId: string,
  endorsedId: string,
  skillName: string,
): Promise<boolean> {
  const { data } = await api.post<ApiEnvelope<{ result: boolean }>>(
    `/users/${endorserId}/endorse`,
    { endorsedId, skillName },
  );
  return data.data.result;
}
export async function notifySkillEndorsement(payload: {
  userId: string;
  targetId: string;
  contentId: string;
}) {
  await api.post("/notifications/endorse-skill", {
    ...payload,
    contentType: "skill",
  });
}
export async function getAchievements(userId: string): Promise<AchievementsSummary> {
  const { data } = await api.get<ApiEnvelope<AchievementsSummary>>(`/achievements/${userId}`);
  return data.data;
}
export async function claimAchievement(userId: string, achievementId: string) {
  await api.post(`/achievements/${userId}/${achievementId}/claim`);
}
export async function getSalaryEstimation(userId: string): Promise<SalaryEstimation> {
  const { data } = await api.get<ApiEnvelope<SalaryEstimation>>(
    `/users/${userId}/salary-estimation`,
  );
  return data.data;
}
export async function recalculateSalary(userId: string): Promise<SalaryEstimation> {
  const { data } = await api.post<ApiEnvelope<SalaryEstimation>>(
    `/users/${userId}/salary-estimation/recalculate`,
  );
  return data.data;
}
export async function getSalaryHistory(userId: string): Promise<SalaryHistoryItem[]> {
  const { data } = await api.get<ApiEnvelope<SalaryHistoryItem[]>>(
    `/users/${userId}/salary-estimation/history`,
    { params: { limit: 12 } },
  );
  return data.data ?? [];
}
