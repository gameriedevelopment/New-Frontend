import { useInfiniteQuery } from "@tanstack/react-query";
import { getLeaderboard } from "./api";
import type { LeaderboardFilters } from "./types";

export function useLeaderboard(filters: LeaderboardFilters) {
  return useInfiniteQuery({
    queryKey: ["leaderboard", filters],
    queryFn: ({ pageParam }) => getLeaderboard(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 2 * 60_000,
  });
}
