import { api } from "../../lib/api";
import type { PlayerFilters, PlayerPage, SearchEntity, SearchKind, SearchPage } from "./types";

interface ApiEnvelope<T> { data: T; }

export async function getPlayers(filters: PlayerFilters, page = 1): Promise<PlayerPage> {
  const { data } = await api.get<ApiEnvelope<PlayerPage>>("/users", {
    params: {
      search: filters.search || undefined,
      gameLevel: filters.gameLevel || undefined,
      platform: filters.platform || undefined,
      game: filters.game || undefined,
      region: filters.region || undefined,
      canFetchCurrentUser: false,
      page,
      limit: 12,
    },
  });
  return data.data;
}

export async function searchGamerie(kind: SearchKind, term: string, page = 1): Promise<SearchPage> {
  const { data } = await api.get<ApiEnvelope<SearchPage<SearchEntity>>>(`/search/${kind}`, {
    params: { term, page, limit: 12 },
  });
  return data.data;
}
