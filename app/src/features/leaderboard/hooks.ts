import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "./api";
import type { LeaderboardFilters } from "./types";

export function useLeaderboard(filters: LeaderboardFilters, page: number) {
  return useQuery({
    queryKey: ["leaderboard", filters, page],
    queryFn: () => getLeaderboard(filters, page),
    staleTime: 2 * 60_000,
  });
}
