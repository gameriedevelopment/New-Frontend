import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminAchievement,
  deleteAdminChallenge,
  deleteAdminTournament,
  getAdminAchievements,
  getAdminChallenges,
  getAdminTournaments,
  saveAdminAchievement,
  saveAdminChallenge,
  saveAdminTournament,
} from "./api";
import type {
  AdminAchievementInput,
  AdminAchievementQuery,
  AdminChallengeQuery,
  CreateAdminChallengeInput,
  AdminTournamentInput,
  AdminTournamentQuery,
  UpdateAdminChallengeInput,
} from "./types";

export const useAdminChallenges = (query: AdminChallengeQuery, enabled = true) =>
  useQuery({
    queryKey: ["admin", "challenges", query],
    queryFn: () => getAdminChallenges(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useAdminTournaments = (query: AdminTournamentQuery, enabled = true) =>
  useQuery({
    queryKey: ["admin", "tournaments", query],
    queryFn: () => getAdminTournaments(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useAdminAchievements = (query: AdminAchievementQuery, enabled = true) =>
  useQuery({
    queryKey: ["admin", "achievements", query],
    queryFn: () => getAdminAchievements(query),
    placeholderData: keepPreviousData,
    enabled,
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

export function useSaveChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id?: string;
      input: CreateAdminChallengeInput | UpdateAdminChallengeInput;
    }) => saveAdminChallenge(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "challenges"] }),
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
      kind: "tournament" | "challenge" | "achievement";
      id: string;
      reason: string;
    }) =>
      kind === "tournament"
        ? deleteAdminTournament(id, reason)
        : kind === "challenge"
          ? deleteAdminChallenge(id, reason)
          : deleteAdminAchievement(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
  });
}
