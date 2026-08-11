import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getTournamentFacets, getTournaments } from "./api";
import type { TournamentFilters } from "./types";

export function useTournaments(filters: TournamentFilters) {
  return useInfiniteQuery({
    queryKey: ["tournaments", "directory", filters],
    queryFn: ({ pageParam }) => getTournaments(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    staleTime: 60_000,
  });
}

export function useTournamentFacets() {
  return useQuery({
    queryKey: ["tournaments", "facets"],
    queryFn: getTournamentFacets,
    staleTime: 10 * 60_000,
  });
}
