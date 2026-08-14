import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimAchievement,
  followPlayer,
  getAchievements,
  getMyReferrals,
  getPlayerConnections,
  getPlayerMatches,
  getPlayerPosts,
  getPlayerProfile,
  getPublicPlayerCard,
  getPlayerRankings,
  getProfileTeams,
  getSalaryEstimation,
  getSalaryHistory,
  getSkillEndorsers,
  notifySkillEndorsement,
  recalculateSalary,
  searchGameOptions,
  toggleSkillEndorsement,
  unfollowPlayer,
  updatePlayerProfile,
  uploadPlayerImage,
} from "./api";
import { syncUserWithBackend } from "../auth/api";
import { updatePlayerFollowCache } from "./followCache";

export function usePlayerProfile(identity?: string) {
  return useQuery({
    queryKey: ["player-profile", identity],
    queryFn: () => getPlayerProfile(identity!),
    enabled: Boolean(identity),
    retry: 2,
    staleTime: 60_000,
  });
}

export function usePublicPlayerCard(username?: string) {
  return useQuery({
    queryKey: ["public-player-card", username],
    queryFn: () => getPublicPlayerCard(username!),
    enabled: Boolean(username),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useProfileTeams(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["profile-teams", userId],
    queryFn: () => getProfileTeams(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
  });
}

export function usePlayerConnections(
  userId: string,
  kind: "followers" | "following",
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["player-connections", userId, kind],
    queryFn: ({ pageParam }) => getPlayerConnections(userId, kind, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
  });
}

export function useMyReferrals(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["my-referrals"],
    queryFn: ({ pageParam }) => getMyReferrals(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.totalPages ? page.pagination.page + 1 : undefined,
    enabled,
    staleTime: 60_000,
  });
}

export function useGameOptions(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["game-options", search],
    queryFn: ({ pageParam }) => searchGameOptions(search, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePlayerProfile(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (updates: Parameters<typeof updatePlayerProfile>[1]) =>
      updatePlayerProfile(userId!, updates),
    onSuccess: async (profile) => {
      client.setQueryData(["player-profile", profile.username], profile);
      client.setQueryData(["player-profile", profile.id], profile);
      await client.invalidateQueries({ queryKey: ["player-profile"] });
      await syncUserWithBackend();
    },
  });
}

export function useUploadPlayerImage(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: "profileImage" | "backgroundImage" }) =>
      uploadPlayerImage(userId!, file, type),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["player-profile"] });
      await syncUserWithBackend();
    },
  });
}

export function useTogglePlayerFollow(
  currentUserId: string | undefined,
  profileId: string,
  following: boolean,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Your session could not be resolved.");
      return following
        ? unfollowPlayer(currentUserId, profileId)
        : followPlayer(currentUserId, profileId);
    },
    onMutate: async () => {
      const queryKeys = [["player-profile"], ["discovery-players"], ["unified-search"]] as const;
      await Promise.all(
        queryKeys.map((queryKey) => client.cancelQueries({ queryKey: [...queryKey] })),
      );
      const snapshots = queryKeys.flatMap((queryKey) =>
        client.getQueriesData({ queryKey: [...queryKey] }),
      );
      queryKeys.forEach((queryKey) =>
        client.setQueriesData({ queryKey: [...queryKey] }, (value: unknown) =>
          updatePlayerFollowCache(value, profileId, following),
        ),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) =>
      context?.snapshots.forEach(([key, value]) => client.setQueryData(key, value)),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ["player-profile"] });
      client.invalidateQueries({ queryKey: ["player-connections"] });
      client.invalidateQueries({ queryKey: ["discovery-players"] });
      client.invalidateQueries({ queryKey: ["unified-search", "players"] });
    },
  });
}

export function usePlayerRankings(userId: string) {
  return useQuery({
    queryKey: ["player-rankings", userId],
    queryFn: () => getPlayerRankings(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
export function usePlayerMatches(userId: string) {
  return useQuery({
    queryKey: ["player-matches", userId],
    queryFn: () => getPlayerMatches(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
export function usePlayerPosts(userId: string) {
  return useQuery({
    queryKey: ["wall-posts", userId],
    queryFn: () => getPlayerPosts(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
export function useSkillEndorsers(userId: string, skillId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["skill-endorsers", userId, skillId],
    queryFn: ({ pageParam }) => getSkillEndorsers(userId, skillId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(userId && skillId) && enabled,
    staleTime: 60_000,
  });
}
export function useToggleSkillEndorsement(endorserId: string | undefined, endorsedId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      skillId,
      skillName,
      alreadyEndorsed,
    }: {
      skillId?: string;
      skillName: string;
      alreadyEndorsed: boolean;
    }) => {
      if (!endorserId) throw new Error("Your session could not be resolved.");
      const result = await toggleSkillEndorsement(endorserId, endorsedId, skillName);
      if (!alreadyEndorsed && skillId && endorserId !== endorsedId)
        notifySkillEndorsement({
          userId: endorserId,
          targetId: endorsedId,
          contentId: skillId,
        }).catch(() => undefined);
      return result;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["player-profile"] });
      client.invalidateQueries({ queryKey: ["skill-endorsers", endorsedId] });
    },
  });
}
export function useAchievements(userId: string) {
  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => getAchievements(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
export function useClaimAchievement(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: string) => claimAchievement(userId, achievementId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["achievements", userId] }),
        client.invalidateQueries({ queryKey: ["player-profile"] }),
      ]);
      await syncUserWithBackend();
    },
  });
}
export function useSalaryInsights(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["salary-insights", userId],
    queryFn: () => getSalaryEstimation(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60_000,
  });
}
export function useSalaryHistory(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["salary-history", userId],
    queryFn: () => getSalaryHistory(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60_000,
  });
}
export function useRecalculateSalary(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => recalculateSalary(userId),
    onSuccess: (data) => {
      client.setQueryData(["salary-insights", userId], data);
      client.invalidateQueries({ queryKey: ["salary-history", userId] });
    },
  });
}
