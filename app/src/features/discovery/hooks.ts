import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getPlayers, searchGamerie } from "./api";
import type { PlayerFilters, SearchKind } from "./types";

export function useDebouncedValue(value: string, delay = 280) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

export function usePlayers(filters: PlayerFilters) {
  return useInfiniteQuery({
    queryKey: ["discovery-players", filters],
    queryFn: ({ pageParam }) => getPlayers(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.page < page.totalPages ? page.page + 1 : undefined,
    staleTime: 2 * 60_000,
  });
}

export function useUnifiedSearch(kind: SearchKind, term: string) {
  return useInfiniteQuery({
    queryKey: ["unified-search", kind, term],
    queryFn: ({ pageParam }) => searchGamerie(kind, term, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.page < page.totalPages ? page.page + 1 : undefined,
    enabled: term.trim().length > 0,
    staleTime: 60_000,
  });
}
