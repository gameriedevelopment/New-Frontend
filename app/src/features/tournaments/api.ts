import { api } from "../../lib/api";
import type { TournamentFacets, TournamentFilters, TournamentPageData } from "./types";

interface Envelope<T> {
  data: T;
}

export async function getTournaments(
  filters: TournamentFilters,
  page = 1,
  limit = 12,
): Promise<TournamentPageData> {
  const { data } = await api.get<Envelope<TournamentPageData>>("/tournaments", {
    params: {
      search: filters.search || undefined,
      game: filters.game || undefined,
      platform: filters.platform || undefined,
      region: filters.region || undefined,
      skillLevel: filters.skillLevel || undefined,
      prizeMin: filters.prizeMin || undefined,
      teamSize: filters.teamSize || undefined,
      status: filters.status,
      page,
      limit,
    },
  });
  return {
    tournaments: data.data.tournaments ?? [],
    total: Number(data.data.total ?? 0),
    page: Number(data.data.page ?? page),
    limit: Number(data.data.limit ?? limit),
    hasMore: Boolean(data.data.hasMore),
  };
}

export async function getTournamentFacets(): Promise<TournamentFacets> {
  const { data } = await api.get<Envelope<TournamentFacets>>("/tournaments/facets");
  return data.data;
}
