import { api } from "../../lib/api";
import type { LeaderboardFilters, LeaderboardPageData } from "./types";

interface Envelope<T> {
  data: T;
}

export async function getLeaderboard(
  filters: LeaderboardFilters,
  page = 1,
  limit = 15,
): Promise<LeaderboardPageData> {
  const { data } = await api.get<Envelope<LeaderboardPageData>>("/leaderboard", {
    params: { ...filters, game: filters.game || undefined, page, limit },
  });
  return {
    data: data.data.data ?? [],
    total: Number(data.data.total ?? 0),
    page: Number(data.data.page ?? page),
    limit: Number(data.data.limit ?? limit),
    totalPages: Number(data.data.totalPages ?? 1),
  };
}
