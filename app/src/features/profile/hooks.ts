import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followPlayer, getPlayerProfile, unfollowPlayer, updatePlayerProfile, uploadPlayerImage } from "./api";
import { syncUserWithBackend } from "../auth/api";

export function usePlayerProfile(identity?: string) {
  return useQuery({
    queryKey: ["player-profile", identity],
    queryFn: () => getPlayerProfile(identity!),
    enabled: Boolean(identity),
    retry: 2,
    staleTime: 60_000,
  });
}

export function useUpdatePlayerProfile(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (updates: Parameters<typeof updatePlayerProfile>[1]) => updatePlayerProfile(userId!, updates),
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
    mutationFn: ({ file, type }: { file: File; type: "profileImage" | "backgroundImage" }) => uploadPlayerImage(userId!, file, type),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["player-profile"] });
      await syncUserWithBackend();
    },
  });
}

export function useTogglePlayerFollow(currentUserId: string | undefined, profileId: string, following: boolean) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Your session could not be resolved.");
      return following ? unfollowPlayer(currentUserId, profileId) : followPlayer(currentUserId, profileId);
    },
    onMutate: async () => {
      await client.cancelQueries({ queryKey: ["player-profile"] });
      const snapshots = client.getQueriesData({ queryKey: ["player-profile"] });
      client.setQueriesData({ queryKey: ["player-profile"] }, (value: unknown) => {
        if (!value || typeof value !== "object" || (value as { id?: string }).id !== profileId) return value;
        const profile = value as { isFollowedByCurrentUser?: boolean; followersCount?: number };
        return { ...profile, isFollowedByCurrentUser: !following, followersCount: Math.max(0, Number(profile.followersCount ?? 0) + (following ? -1 : 1)) };
      });
      return { snapshots };
    },
    onError: (_error, _variables, context) => context?.snapshots.forEach(([key, value]) => client.setQueryData(key, value)),
    onSettled: () => client.invalidateQueries({ queryKey: ["player-profile"] }),
  });
}
