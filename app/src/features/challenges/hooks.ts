import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getMyChallenges,
  proposeReschedule,
  refreshChallenge,
  reportChallengeScore,
  respondReschedule,
  updateChallenge,
  type ReportScorePayload,
} from "./api";
import type { ChallengeFilters, ChallengeType, CreateChallengePayload } from "./types";

function reconcile(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["challenges"] });
  void client.invalidateQueries({ queryKey: ["player-matches"] });
  void client.invalidateQueries({ queryKey: ["user-events"] });
  void client.invalidateQueries({ queryKey: ["team-wallet"] });
  void client.invalidateQueries({ queryKey: ["player-rankings"] });
  void client.invalidateQueries({ queryKey: ["leaderboard"] });
}

export function useMyChallenges(filters: ChallengeFilters) {
  return useInfiniteQuery({
    queryKey: ["challenges", "mine", filters],
    queryFn: ({ pageParam }) => getMyChallenges(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    staleTime: 30_000,
  });
}

export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ["challenges", "detail", id],
    queryFn: () => getChallenge(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => createChallenge(payload),
    onSuccess: () => reconcile(client),
  });
}

export function useUpdateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      updates,
    }: {
      id: string;
      type: ChallengeType;
      updates: Parameters<typeof updateChallenge>[2];
    }) => updateChallenge(id, type, updates),
    onSuccess: (challenge) => {
      client.setQueryData(["challenges", "detail", challenge.id], challenge);
      reconcile(client);
    },
  });
}

export function useRefreshChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      scheduledDate,
    }: {
      id: string;
      type: ChallengeType;
      scheduledDate: string;
    }) => refreshChallenge(id, type, scheduledDate),
    onSuccess: (challenge) => {
      client.setQueryData(["challenges", "detail", challenge.id], challenge);
      reconcile(client);
    },
  });
}

export function useProposeReschedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      scheduledDate,
    }: {
      id: string;
      type: ChallengeType;
      scheduledDate: string;
    }) => proposeReschedule(id, type, scheduledDate),
    onSuccess: (challenge) => {
      client.setQueryData(["challenges", "detail", challenge.id], challenge);
      reconcile(client);
    },
  });
}

export function useRespondReschedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, accept }: { id: string; type: ChallengeType; accept: boolean }) =>
      respondReschedule(id, type, accept),
    onSuccess: (challenge) => {
      client.setQueryData(["challenges", "detail", challenge.id], challenge);
      reconcile(client);
    },
  });
}

export function useReportChallengeScore() {
  return useMutation({
    mutationFn: (payload: ReportScorePayload) => reportChallengeScore(payload),
  });
}

export function useDeleteChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: ChallengeType }) => deleteChallenge(id, type),
    onSuccess: () => reconcile(client),
  });
}
