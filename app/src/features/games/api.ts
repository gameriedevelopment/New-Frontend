import { api } from "../../lib/api";
import type {
  ActiveGameTeam,
  ActiveGameUser,
  ActiveTeamFilters,
  Game,
  GameFilters,
  GameStats,
  GridGameKey,
  GridSeriesResponse,
  Paginated,
} from "./types";

interface ApiEnvelope<T> { data: T; }

export async function getGames(filters: GameFilters, page = 1, limit = 12): Promise<Paginated<Game>> {
  const { data } = await api.get<ApiEnvelope<Paginated<Game>>>("/games", {
    params: {
      search: filters.search || undefined,
      gameType: filters.gameType || undefined,
      platform: filters.platform || undefined,
      minFollowers: filters.minFollowers || undefined,
      page,
      limit,
    },
  });
  return data.data;
}

export async function getGame(gameId: string): Promise<Game> {
  const { data } = await api.get<ApiEnvelope<Game>>(`/games/${gameId}`);
  return data.data;
}

export async function getGameStats(gameId: string): Promise<GameStats> {
  const { data } = await api.get<ApiEnvelope<GameStats>>(`/games/stats/${gameId}`);
  return data.data;
}

export async function getGamesStats(gameIds: string[]): Promise<Record<string, GameStats>> {
  const { data } = await api.post<ApiEnvelope<Record<string, GameStats>>>("/games/stats/batch", { gameIds });
  return data.data;
}

export async function getActiveGameUsers(gameId: string, search: string, page = 1): Promise<Paginated<ActiveGameUser>> {
  const { data } = await api.get<Paginated<ActiveGameUser>>(`/games/users/${gameId}`, {
    params: { searchTerm: search || undefined, page, limit: 12 },
  });
  return { ...data, page: Number(data.page), limit: Number(data.limit), total: Number(data.total), totalPages: Number(data.totalPages) };
}

export async function getActiveGameTeams(gameId: string, filters: ActiveTeamFilters, page = 1): Promise<Paginated<ActiveGameTeam>> {
  const { data } = await api.get<Paginated<ActiveGameTeam>>(`/games/teams/${gameId}`, {
    params: {
      searchTerm: filters.search || undefined,
      region: filters.region || undefined,
      minRanking: filters.minRanking || undefined,
      page,
      limit: 12,
    },
  });
  return { ...data, page: Number(data.page), limit: Number(data.limit), total: Number(data.total), totalPages: Number(data.totalPages) };
}

export async function getGridSeries(game: GridGameKey): Promise<GridSeriesResponse> {
  const { data } = await api.get<GridSeriesResponse>(`/grid/series/${game}`, {
    params: { daysBack: 7, daysForward: 14, first: 25 },
  });
  return data;
}
