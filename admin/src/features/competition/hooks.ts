import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminAchievement,
  deleteAdminTournament,
  getAdminAchievements,
  getAdminTournaments,
  saveAdminAchievement,
  saveAdminTournament,
} from "./api";
import type {
  AdminAchievementInput,
  AdminAchievementQuery,
  AdminTournamentInput,
  AdminTournamentQuery,
} from "./types";

export const useAdminTournaments = (query: AdminTournamentQuery) =>
  useQuery({
    queryKey: ["admin", "tournaments", query],
    queryFn: () => getAdminTournaments(query),
    placeholderData: keepPreviousData,
  });

export const useAdminAchievements = (query: AdminAchievementQuery) =>
  useQuery({
    queryKey: ["admin", "achievements", query],
    queryFn: () => getAdminAchievements(query),
    placeholderData: keepPreviousData,
  });

export function useSaveTournament() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AdminTournamentInput }) =>
      saveAdminTournament(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "tournaments"] }),
  });
}

export function useSaveAchievement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AdminAchievementInput }) =>
      saveAdminAchievement(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "achievements"] }),
  });
}

export function useDeleteCompetition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      id,
      reason,
    }: {
      kind: "tournament" | "achievement";
      id: string;
      reason: string;
    }) =>
      kind === "tournament"
        ? deleteAdminTournament(id, reason)
        : deleteAdminAchievement(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
  });
}
