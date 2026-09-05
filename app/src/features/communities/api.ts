import { api } from "../../lib/api";
import type {
  CommunityFilters,
  CommunityFormPayload,
  CommunityInvite,
  CommunityMediaFiles,
  DirectoryPage,
  HubDashboard,
  HubPendingInvites,
  HubRequestSummary,
  HubSummary,
  HubTeamRequestSummary,
  TeamFollowerPage,
  TeamGameRanking,
  TeamRequestSummary,
  TeamSummary,
  TeamWalletSummary,
  TeamWalletInsights,
  TeamWalletTransaction,
  TeamWalletTransactionFilters,
  TeamWalletTransactionPage,
} from "./types";
import type { FeedPost } from "../newsfeed/types";

interface Envelope<T> {
  data: T;
}
export async function getTeams(
  filters: CommunityFilters,
  page: number,
): Promise<DirectoryPage<TeamSummary>> {
  const { data } = await api.get<
    Envelope<{ teams: TeamSummary[]; total: number; totalPages: number }>
  >("/teams", {
    params: {
      searchTerm: filters.search || undefined,
      level: filters.level || undefined,
      region: filters.region || undefined,
      game: filters.game || undefined,
      page,
      perPage: 12,
    },
  });
  return {
    items: data.data.teams,
    total: Number(data.data.total),
    totalPages: Number(data.data.totalPages),
    page,
  };
}
export async function getHubs(
  filters: CommunityFilters,
  page: number,
): Promise<DirectoryPage<HubSummary>> {
  const { data } = await api.get<
    Envelope<{ hubs: HubSummary[]; total: number; totalPages: number }>
  >("/hubs", {
    params: {
      searchTerm: filters.search || undefined,
      type: filters.type || undefined,
      region: filters.region || undefined,
      game: filters.game || undefined,
      page,
      perPage: 12,
    },
  });
  return {
    items: data.data.hubs,
    total: Number(data.data.total),
    totalPages: Number(data.data.totalPages),
    page,
  };
}
export async function getTeam(slug: string) {
  const { data } = await api.get<Envelope<TeamSummary>>(
    `/teams/by-slug/${encodeURIComponent(slug)}`,
  );
  return data.data;
}
export async function getHub(slug: string) {
  const { data } = await api.get<Envelope<HubSummary>>(`/hubs/by-slug/${encodeURIComponent(slug)}`);
  return data.data;
}
export async function getUserHubs(userId: string): Promise<HubSummary[]> {
  const { data } = await api.get<Envelope<HubSummary[]>>(`/hubs/user/${userId}`);
  return Array.isArray(data.data) ? data.data : [];
}
export async function getTeamInvites() {
  const { data } = await api.get<Envelope<CommunityInvite<TeamSummary>[]>>("/teams/invites/mine");
  return data.data;
}
export async function getHubInvites() {
  const { data } = await api.get<Envelope<CommunityInvite<HubSummary>[]>>("/hubs/invites/mine");
  return data.data;
}
export async function getHubMembershipRequest(requestId: string) {
  const { data } = await api.get<Envelope<HubRequestSummary>>(`/hubs/request/${requestId}`);
  return data.data;
}
export async function respondToInvite(kind: "team" | "hub", id: string, accept: boolean) {
  const path =
    kind === "team"
      ? `/teams/invite/${id}/${accept ? "accept" : "decline"}`
      : `/hubs/request/${id}/${accept ? "accept" : "reject"}`;
  await api.patch(path);
}
export async function toggleCommunityFollow(kind: "team" | "hub", id: string, following: boolean) {
  if (following) await api.delete(`/${kind}s/${id}/unfollow`);
  else await api.post(`/${kind}s/${id}/follow`);
}
export async function requestTeamJoin(teamId: string, message: string) {
  await api.post("/teams/request", { teamId, message });
}
export async function joinHub(hubId: string, message: string) {
  const { data } = await api.post<Envelope<{ joined: boolean }>>(`/hubs/${hubId}/join`, {
    message,
  });
  return data.data;
}
export async function leaveCommunity(kind: "team" | "hub", id: string) {
  await api.delete(`/${kind}s/${id}/leave`);
}
export async function reportCommunity(
  kind: "team" | "hub",
  id: string,
  ownerId: string,
  type: string,
  reason: string,
) {
  await api.post("/reports", {
    contentId: id,
    contentType: kind,
    contentAuthorId: ownerId,
    type,
    reason,
  });
}
export async function getCommunityPosts(kind: "team" | "hub", id: string): Promise<FeedPost[]> {
  const { data } = await api.get<Envelope<FeedPost[]>>(`/newsfeed/${kind}/${id}`);
  return Array.isArray(data.data) ? data.data : [];
}
export async function getTeamRequests(teamId: string) {
  const { data } = await api.get<Envelope<TeamRequestSummary[]>>(`/teams/request/${teamId}/all`);
  return Array.isArray(data.data) ? data.data : [];
}
export async function getTeamPendingInvites(teamId: string) {
  const { data } = await api.get<Envelope<TeamRequestSummary[]>>(
    `/teams/${teamId}/pending-invites`,
  );
  return Array.isArray(data.data) ? data.data : [];
}
export async function inviteTeamMember(teamId: string, username: string) {
  const { data } = await api.post<Envelope<TeamRequestSummary>>(`/teams/${teamId}/invite`, {
    username,
  });
  return data.data;
}
export async function respondTeamRequest(requestId: string, accept: boolean) {
  await api.patch(`/teams/request/${requestId}/${accept ? "accept" : "reject"}`);
}
export async function cancelTeamInvite(teamId: string, userId: string) {
  await api.delete(`/teams/${teamId}/invite/${userId}`);
}
export async function changeTeamMember(
  teamId: string,
  userId: string,
  role: string,
  title: string,
) {
  await api.patch(`/teams/${teamId}/members/${userId}/role`, { role, title });
}
export async function removeTeamMember(teamId: string, userId: string) {
  await api.delete(`/teams/${teamId}/members/${userId}`);
}
export async function getTeamFollowers(teamId: string, page = 1): Promise<TeamFollowerPage> {
  const { data } = await api.get<
    Envelope<{
      data: TeamFollowerPage["items"];
      total: number;
      page: number;
      totalPages: number;
    }>
  >(`/teams/followers/${teamId}`, { params: { page, limit: 18 } });
  return {
    items: data.data.data || [],
    total: Number(data.data.total || 0),
    page: Number(data.data.page || page),
    totalPages: Number(data.data.totalPages || 1),
  };
}
export async function getTeamGameRanks(teamId: string) {
  const { data } = await api.get<Envelope<TeamGameRanking[]>>(`/teams/game-ranks/${teamId}`);
  return Array.isArray(data.data) ? data.data : [];
}
export async function getHubRequests(hubId: string) {
  const { data } = await api.get<Envelope<HubRequestSummary[]>>(`/hubs/request/${hubId}/all`);
  return Array.isArray(data.data) ? data.data : [];
}
export async function getHubTeamRequests(hubId: string) {
  const { data } = await api.get<Envelope<HubTeamRequestSummary[]>>(
    `/hubs/team-request/${hubId}/all`,
  );
  return Array.isArray(data.data) ? data.data : [];
}
export async function getHubPendingInvites(hubId: string): Promise<HubPendingInvites> {
  const { data } = await api.get<Envelope<Partial<HubPendingInvites>>>(
    `/hubs/${hubId}/pending-invites`,
  );
  return {
    userIds: data.data.userIds || [],
    teamIds: data.data.teamIds || [],
    users: data.data.users || [],
    teams: data.data.teams || [],
  };
}
export async function getHubDashboard(hubId: string) {
  const { data } = await api.get<Envelope<HubDashboard>>(`/hubs/${hubId}/dashboard`);
  return data.data;
}
export async function inviteHubMember(hubId: string, userId: string, message?: string) {
  await api.post(`/hubs/${hubId}/invite`, { userId, message });
}
export async function inviteTeamToHub(hubId: string, teamId: string, message?: string) {
  await api.post(`/hubs/${hubId}/invite-team`, { teamId, message });
}
export async function respondHubRequest(requestId: string, accept: boolean) {
  await api.patch(`/hubs/request/${requestId}/${accept ? "accept" : "reject"}`);
}
export async function respondHubTeamRequest(requestId: string, accept: boolean) {
  await api.patch(`/hubs/team-request/${requestId}/${accept ? "accept" : "reject"}`);
}
export async function cancelHubUserInvite(hubId: string, userId: string) {
  await api.delete(`/hubs/${hubId}/invite/user/${userId}`);
}
export async function cancelHubTeamInvite(hubId: string, teamId: string) {
  await api.delete(`/hubs/${hubId}/invite/team/${teamId}`);
}
export async function changeHubMember(hubId: string, userId: string, role: string, title: string) {
  await api.patch(`/hubs/${hubId}/members/${userId}/role`, { role, title });
}
export async function removeHubMember(hubId: string, userId: string) {
  await api.delete(`/hubs/${hubId}/members/${userId}`);
}
export async function removeHubTeam(hubId: string, teamId: string) {
  await api.delete(`/hubs/${hubId}/teams/${teamId}`);
}
export async function updateHubPolicy(hubId: string, visibility: string, joinPolicy: string) {
  const { data } = await api.patch<Envelope<HubSummary>>(`/hubs/${hubId}`, {
    visibility,
    joinPolicy,
  });
  return data.data;
}
export async function getTeamWallet(teamId: string) {
  const { data } = await api.get<Envelope<TeamWalletSummary>>(`/wallet/team-wallet/${teamId}`);
  return data.data;
}
export async function getTeamWalletInsights(teamId: string) {
  const { data } = await api.get<Envelope<TeamWalletInsights>>(
    `/wallet/team-wallet-insights/${teamId}`,
  );
  return data.data;
}
export async function getTeamWalletTransactions(
  teamId: string,
  filters: TeamWalletTransactionFilters,
  page = 1,
  perPage = 15,
): Promise<TeamWalletTransactionPage> {
  const { data } = await api.get<Envelope<Omit<TeamWalletTransactionPage, "page">>>(
    `/wallet/team-wallet/${teamId}/transactions`,
    {
      params: { ...filters, page, perPage },
    },
  );
  return { ...data.data, page };
}
export async function transferTeamWalletTokens(payload: {
  teamId: string;
  amount: number;
  recipientTeamId?: string;
  recipientUserId?: string;
  idempotencyKey: string;
}): Promise<TeamWalletTransaction> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await api.post<Envelope<TeamWalletTransaction>>("/wallet/transfer/team", body, {
    headers: { "x-idempotency-key": idempotencyKey },
  });
  return data.data;
}
export async function transferCommunityOwnership(
  kind: "team" | "hub",
  id: string,
  newOwnerId: string,
) {
  await api.patch(`/${kind}s/${id}/transfer-ownership`, { newOwnerId });
}
export async function deleteCommunity(kind: "team" | "hub", id: string) {
  await api.delete(`/${kind}s/${id}`);
}

function formDataFor(payload: CommunityFormPayload, files: CommunityMediaFiles) {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    body.append(
      key,
      Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  });
  if (files.logo) body.append("logo", files.logo);
  if (files.background) body.append("background", files.background);
  return body;
}

export async function createCommunity(
  kind: "team" | "hub",
  payload: CommunityFormPayload,
  files: CommunityMediaFiles,
) {
  const { data } = await api.post<Envelope<TeamSummary | HubSummary>>(
    `/${kind}s`,
    formDataFor(payload, files),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}

export async function updateCommunity(
  kind: "team" | "hub",
  id: string,
  payload: CommunityFormPayload,
  files: CommunityMediaFiles,
) {
  const { data } = await api.patch<Envelope<TeamSummary | HubSummary>>(`/${kind}s/${id}`, payload);
  if (files.logo || files.background) {
    const media = new FormData();
    if (files.logo) media.append("logo", files.logo);
    if (files.background) media.append("background", files.background);
    await api.post(`/${kind}s/${id}/upload`, media, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return data.data;
}
