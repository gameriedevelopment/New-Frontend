import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayerSettings, updatePlayerSettings } from "./api";
import type { PlayerSettings } from "./types";

export function usePlayerSettings(userId?: string) {
  return useQuery({
    queryKey: ["player-settings", userId],
    queryFn: () => getPlayerSettings(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useUpdatePlayerSettings(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: PlayerSettings) => updatePlayerSettings(userId!, settings),
    onSuccess: (settings) => {
      client.setQueryData(["player-settings", userId], settings);
      client.invalidateQueries({ queryKey: ["player-profile"] });
    },
  });
}
