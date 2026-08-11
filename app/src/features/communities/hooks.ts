import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelHubTeamInvite,
  cancelHubUserInvite,
  cancelTeamInvite,
  changeHubMember,
  changeTeamMember,
  createCommunity,
  deleteCommunity,
  getCommunityPosts,
  getHub,
  getHubDashboard,
  getHubInvites,
  getHubPendingInvites,
  getHubRequests,
  getHubs,
  getHubTeamRequests,
  getUserHubs,
  getTeam,
  getTeamFollowers,
  getTeamGameRanks,
  getTeamInvites,
  getTeamPendingInvites,
  getTeamRequests,
  getTeams,
  getTeamWallet,
  getTeamWalletInsights,
  getTeamWalletTransactions,
  inviteHubMember,
  inviteTeamMember,
  inviteTeamToHub,
  joinHub,
  leaveCommunity,
  removeHubMember,
  removeHubTeam,
  removeTeamMember,
  reportCommunity,
  requestTeamJoin,
  respondHubRequest,
  respondHubTeamRequest,
  respondTeamRequest,
  respondToInvite,
  toggleCommunityFollow,
  transferCommunityOwnership,
  transferTeamWalletTokens,
  updateCommunity,
  updateHubPolicy,
} from "./api";
import type {
  CommunityFilters,
  CommunityFormPayload,
  CommunityMediaFiles,
  TeamWalletTransactionFilters,
} from "./types";
const refreshMembershipCaches = (client: ReturnType<typeof useQueryClient>) => {
  void client.invalidateQueries({ queryKey: ["profile-teams"] });
  void client.invalidateQueries({ queryKey: ["user-teams"] });
  void client.invalidateQueries({ queryKey: ["user-hubs"] });
  void client.invalidateQueries({ queryKey: ["player-profile"] });
};
export function useCommunityDirectory(
  kind: "teams" | "hubs",
  filters: CommunityFilters,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [kind, "directory", filters],
    queryFn: ({ pageParam }) =>
      kind === "teams" ? getTeams(filters, pageParam) : getHubs(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled,
    staleTime: 60_000,
  });
}
export function useUserHubs(userId?: string, enabled = true) {
  return useQuery({
    queryKey: ["user-hubs", userId],
    queryFn: () => getUserHubs(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 45_000,
  });
}
export function useCommunityInvites(kind: "teams" | "hubs") {
  return useQuery({
    queryKey: [kind, "invites", "mine"],
    queryFn: kind === "teams" ? getTeamInvites : getHubInvites,
    staleTime: 30_000,
  });
}
export function useRespondInvite(kind: "team" | "hub") {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondToInvite(kind, id, accept),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [`${kind}s`, "invites", "mine"] });
      refreshMembershipCaches(client);
    },
  });
}
export function useCommunityDetail(kind: "team" | "hub", slug?: string) {
  return useQuery({
    queryKey: [kind, "detail", slug],
    queryFn: () => (kind === "team" ? getTeam(slug!) : getHub(slug!)),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
export function useCommunityFollow(
  kind: "team" | "hub",
  slug: string,
  id: string,
  following: boolean,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => toggleCommunityFollow(kind, id, following),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [kind, "detail", slug] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
    },
  });
}
export function useCommunityJoin(kind: "team" | "hub", slug: string, id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (kind === "team") await requestTeamJoin(id, message);
      else await joinHub(id, message);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [kind, "detail", slug] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      refreshMembershipCaches(client);
    },
  });
}
export function useCommunityLeave(kind: "team" | "hub", slug: string, id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => leaveCommunity(kind, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [kind, "detail", slug] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      refreshMembershipCaches(client);
    },
  });
}
export function useCommunityReport(kind: "team" | "hub", id: string, ownerId: string) {
  return useMutation({
    mutationFn: ({ type, reason }: { type: string; reason: string }) =>
      reportCommunity(kind, id, ownerId, type, reason),
  });
}
export function useCommunityPosts(kind: "team" | "hub", id: string, enabled: boolean) {
  return useQuery({
    queryKey: [`${kind}-posts`, id],
    queryFn: () => getCommunityPosts(kind, id),
    enabled,
    staleTime: 30_000,
  });
}
export function useCreateCommunity(kind: "team" | "hub") {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      files,
    }: {
      payload: CommunityFormPayload;
      files: CommunityMediaFiles;
    }) => createCommunity(kind, payload, files),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      refreshMembershipCaches(client);
    },
  });
}
export function useUpdateCommunity(kind: "team" | "hub", slug?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files,
    }: {
      id: string;
      payload: CommunityFormPayload;
      files: CommunityMediaFiles;
    }) => updateCommunity(kind, id, payload, files),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [kind, "detail", slug] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      if (kind === "hub") client.invalidateQueries({ queryKey: ["user-hubs"] });
    },
  });
}

const refreshTeam = (client: ReturnType<typeof useQueryClient>, teamId: string, slug: string) => {
  void client.invalidateQueries({ queryKey: ["team", "detail", slug] });
  void client.invalidateQueries({ queryKey: ["team-operations", teamId] });
  void client.invalidateQueries({ queryKey: ["teams", "directory"] });
  refreshMembershipCaches(client);
};
export function useTeamRequests(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["team-operations", teamId, "requests"],
    queryFn: () => getTeamRequests(teamId),
    enabled,
    staleTime: 15_000,
  });
}
export function useTeamPendingInvites(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["team-operations", teamId, "invites"],
    queryFn: () => getTeamPendingInvites(teamId),
    enabled,
    staleTime: 15_000,
  });
}
export function useTeamFollowers(teamId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["team-followers", teamId],
    queryFn: ({ pageParam }) => getTeamFollowers(teamId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled,
    staleTime: 45_000,
  });
}
export function useTeamGameRanks(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["team-game-ranks", teamId],
    queryFn: () => getTeamGameRanks(teamId),
    enabled,
    staleTime: 45_000,
  });
}
export function useInviteTeamMember(teamId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => inviteTeamMember(teamId, username),
    onSuccess: () => refreshTeam(client, teamId, slug),
  });
}
export function useRespondTeamRequest(teamId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondTeamRequest(requestId, accept),
    onSuccess: () => refreshTeam(client, teamId, slug),
  });
}
export function useCancelTeamInvite(teamId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => cancelTeamInvite(teamId, userId),
    onSuccess: () => refreshTeam(client, teamId, slug),
  });
}
export function useChangeTeamMember(teamId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, title }: { userId: string; role: string; title: string }) =>
      changeTeamMember(teamId, userId, role, title),
    onSuccess: () => refreshTeam(client, teamId, slug),
  });
}
export function useRemoveTeamMember(teamId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeTeamMember(teamId, userId),
    onSuccess: () => refreshTeam(client, teamId, slug),
  });
}

const refreshHub = (client: ReturnType<typeof useQueryClient>, hubId: string, slug: string) => {
  void client.invalidateQueries({ queryKey: ["hub", "detail", slug] });
  void client.invalidateQueries({ queryKey: ["hub-operations", hubId] });
  void client.invalidateQueries({ queryKey: ["hubs", "directory"] });
  refreshMembershipCaches(client);
};
export function useHubRequests(hubId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["hub-operations", hubId, "user-requests"],
    queryFn: () => getHubRequests(hubId),
    enabled,
    staleTime: 15_000,
  });
}
export function useHubTeamRequests(hubId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["hub-operations", hubId, "team-requests"],
    queryFn: () => getHubTeamRequests(hubId),
    enabled,
    staleTime: 15_000,
  });
}
export function useHubPendingInvites(hubId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["hub-operations", hubId, "pending-invites"],
    queryFn: () => getHubPendingInvites(hubId),
    enabled,
    staleTime: 15_000,
  });
}
export function useHubDashboard(hubId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["hub-operations", hubId, "dashboard"],
    queryFn: () => getHubDashboard(hubId),
    enabled,
    staleTime: 30_000,
  });
}
export function useInviteHubMember(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      inviteHubMember(hubId, userId, message),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useInviteTeamToHub(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, message }: { teamId: string; message?: string }) =>
      inviteTeamToHub(hubId, teamId, message),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useRespondHubRequest(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondHubRequest(requestId, accept),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useRespondHubTeamRequest(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondHubTeamRequest(requestId, accept),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useCancelHubUserInvite(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => cancelHubUserInvite(hubId, userId),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useCancelHubTeamInvite(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => cancelHubTeamInvite(hubId, teamId),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useChangeHubMember(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, title }: { userId: string; role: string; title: string }) =>
      changeHubMember(hubId, userId, role, title),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useRemoveHubMember(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeHubMember(hubId, userId),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useRemoveHubTeam(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => removeHubTeam(hubId, teamId),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useUpdateHubPolicy(hubId: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ visibility, joinPolicy }: { visibility: string; joinPolicy: string }) =>
      updateHubPolicy(hubId, visibility, joinPolicy),
    onSuccess: () => refreshHub(client, hubId, slug),
  });
}
export function useTeamWallet(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["team-wallet", teamId],
    queryFn: () => getTeamWallet(teamId),
    enabled,
    staleTime: 30_000,
  });
}
export function useTeamWalletInsights(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["team-wallet", teamId, "insights"],
    queryFn: () => getTeamWalletInsights(teamId),
    enabled,
    staleTime: 30_000,
  });
}
export function useTeamWalletTransactions(
  teamId: string,
  filters: TeamWalletTransactionFilters,
  enabled: boolean,
) {
  return useInfiniteQuery({
    queryKey: ["team-wallet", teamId, "transactions", filters],
    queryFn: ({ pageParam }) => getTeamWalletTransactions(teamId, filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(teamId) && enabled,
    staleTime: 20_000,
  });
}
export function useTransferTeamWalletTokens(teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: transferTeamWalletTokens,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["team-wallet", teamId] });
      void client.invalidateQueries({ queryKey: ["wallet"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: ["notification-menu"] });
    },
  });
}
export function useTransferCommunityOwnership(kind: "team" | "hub", id: string, slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (newOwnerId: string) => transferCommunityOwnership(kind, id, newOwnerId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [kind, "detail", slug] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      client.invalidateQueries({ queryKey: [kind, id] });
      client.invalidateQueries({ queryKey: [`${kind}-operations`, id] });
      refreshMembershipCaches(client);
    },
  });
}
export function useDeleteCommunity(kind: "team" | "hub", id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCommunity(kind, id),
    onSuccess: () => {
      client.removeQueries({ queryKey: [kind, "detail"] });
      client.removeQueries({ queryKey: [kind, id] });
      client.invalidateQueries({ queryKey: [`${kind}s`, "directory"] });
      client.invalidateQueries({ queryKey: ["feed-posts"] });
      refreshMembershipCaches(client);
    },
  });
}
