import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getActiveGameTeams,
  getActiveGameUsers,
  getGame,
  getGames,
  getGamesStats,
  getGameStats,
  getGridSeries,
} from "./api";
import type { ActiveTeamFilters, GameFilters, GridGameKey } from "./types";

export function useDebouncedGameValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

export function useGames(filters: GameFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["games", "catalogue", filters],
    queryFn: ({ pageParam }) => getGames(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useGameFacets() {
  return useQuery({
    queryKey: ["games", "catalogue", "facets-source"],
    queryFn: () => getGames({}, 1, 100),
    staleTime: 10 * 60_000,
  });
}

export function useGame(gameId?: string) {
  return useQuery({
    queryKey: ["games", "detail", gameId],
    queryFn: () => getGame(gameId!),
    enabled: Boolean(gameId),
    staleTime: 5 * 60_000,
  });
}

export function useGameStats(gameId?: string) {
  return useQuery({
    queryKey: ["games", "stats", gameId],
    queryFn: () => getGameStats(gameId!),
    enabled: Boolean(gameId),
    staleTime: 60_000,
  });
}

export function useGameStatsBatch(gameIds: string[]) {
  return useQuery({
    queryKey: ["games", "stats", "batch", [...gameIds].sort().join(",")],
    queryFn: () => getGamesStats(gameIds),
    enabled: gameIds.length > 0,
    staleTime: 60_000,
  });
}

export function useActiveGameUsers(gameId: string, search: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["games", gameId, "players", search],
    queryFn: ({ pageParam }) => getActiveGameUsers(gameId, search, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(gameId) && enabled,
    staleTime: 60_000,
  });
}

export function useActiveGameTeams(gameId: string, filters: ActiveTeamFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["games", gameId, "teams", filters],
    queryFn: ({ pageParam }) => getActiveGameTeams(gameId, filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(gameId) && enabled,
    staleTime: 60_000,
  });
}

export function useGridSeries(game?: GridGameKey, enabled = true) {
  return useQuery({
    queryKey: ["games", "grid-series", game],
    queryFn: () => getGridSeries(game!),
    enabled: Boolean(game) && enabled,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}
