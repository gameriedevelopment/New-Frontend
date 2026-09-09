import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdminGame, deleteAdminGame, getAdminGames, updateAdminGame } from "./api";
import type { AdminGameInput, AdminGameQuery } from "./types";

export function useAdminGames(query: AdminGameQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "games", query],
    queryFn: () => getAdminGames(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSaveAdminGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AdminGameInput }) =>
      id ? updateAdminGame(id, input) : createAdminGame(input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "games"] }),
  });
}

export function useDeleteAdminGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteAdminGame(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "games"] }),
  });
}
