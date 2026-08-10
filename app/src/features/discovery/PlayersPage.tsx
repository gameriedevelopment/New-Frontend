import { RotateCcw, Search, SlidersHorizontal, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, SearchSelect, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { useGameOptions } from "../profile/hooks";
import { InfiniteLoadTrigger } from "./components/InfiniteLoadTrigger";
import { PlayerCard } from "./components/PlayerCard";
import { useDebouncedValue, usePlayers } from "./hooks";
import type { PlayerFilters } from "./types";
import "./discovery.css";

const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"];
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"];
const regions = ["Africa", "Asia", "Austria", "Europe", "North America", "South America", "Oceania"];

function PlayerGridSkeleton() {
  return <div className="player-grid" aria-label="Loading players">{Array.from({ length: 6 }, (_, index) => <div className="player-card player-card--skeleton" key={index}><div><Skeleton width={52} height={52} /><SkeletonText lines={2} /></div><Skeleton height={62} /></div>)}</div>;
}

export function PlayersPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [gameSearch, setGameSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(() => ["level", "platform", "game", "region"].some((key) => params.has(key)));
  const debounced = useDebouncedValue(search);
  const games = useGameOptions(gameSearch, true);
  const onGameSearch = useCallback((value: string) => setGameSearch(value), []);
  const change = useCallback((key: string, value?: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  }, [params, setParams]);
  useEffect(() => { if ((params.get("q") || "") !== debounced) change("q", debounced || undefined); }, [change, debounced, params]);
  useEffect(() => { const value = params.get("q") || ""; if (value !== search && value !== debounced) setSearch(value); }, [debounced, params, search]);
  const filters = useMemo<PlayerFilters>(() => ({ search: params.get("q") || undefined, gameLevel: params.get("level") || undefined, platform: params.get("platform") || undefined, game: params.get("game") || undefined, region: params.get("region") || undefined }), [params]);
  const query = usePlayers(filters);
  const players = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const gameOptions = games.data?.pages.flatMap((page) => page.data) ?? [];
  const activeFilters = [filters.gameLevel, filters.platform, filters.game, filters.region].filter(Boolean).length;
  const clear = () => { setSearch(""); setFiltersOpen(false); setParams(new URLSearchParams(), { replace: true }); };

  return <main className="discovery-page">
    <header className="discovery-heading"><div><p>Player network</p><h1>Find your next connection.</h1><span>Meet players through the games, platforms, and level of play you already share.</span></div></header>
    <section className="discovery-toolbar" aria-label="Player discovery filters">
      <div className="discovery-search"><Search size={17} /><label><span className="sr-only">Search players</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players or game identities" autoComplete="off" /></label>{query.isFetching && !query.isFetchingNextPage ? <i aria-label="Updating results" /> : <kbd>/</kbd>}<button className="discovery-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="player-discovery-filters" onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={15} />Filters{activeFilters ? <b>{activeFilters}</b> : null}</button></div>
      <div className="discovery-filters" id="player-discovery-filters" hidden={!filtersOpen}><label><span>Level</span><select value={filters.gameLevel || ""} onChange={(event) => change("level", event.target.value || undefined)}><option value="">All levels</option>{levels.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Platform</span><select value={filters.platform || ""} onChange={(event) => change("platform", event.target.value || undefined)}><option value="">All platforms</option>{platforms.map((value) => <option key={value}>{value}</option>)}</select></label><SearchSelect label="Game" value={filters.game || ""} onChange={(value) => change("game", value || undefined)} onSearch={onGameSearch} loading={games.isLoading} loadingMore={games.isFetchingNextPage} hasMore={games.hasNextPage} onLoadMore={() => { if (!games.isFetchingNextPage) void games.fetchNextPage(); }} options={gameOptions.map((game) => ({ value: game.name, label: game.name, description: game.gameType }))} placeholder="All games" searchPlaceholder="Search games" /><label><span>Region</span><select value={filters.region || ""} onChange={(event) => change("region", event.target.value || undefined)}><option value="">All regions</option>{regions.map((value) => <option key={value}>{value}</option>)}</select></label>{activeFilters || filters.search ? <button type="button" onClick={clear}><RotateCcw size={13} />Clear all</button> : null}</div>
    </section>
    {!query.isLoading && !query.isError ? <div className="discovery-result-meta" role="status" aria-live="polite"><span>{total.toLocaleString()} {total === 1 ? "player" : "players"}</span><small>{activeFilters ? `${activeFilters} active ${activeFilters === 1 ? "filter" : "filters"}` : "Browse the player network"}</small></div> : null}
    {query.isLoading ? <PlayerGridSkeleton /> : query.isError ? <StatePanel tone="error" title="Player discovery could not load" description={getApiErrorMessage(query.error, "Gamerie could not retrieve players right now.")} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : players.length ? <><div className="player-grid">{players.map((player) => <PlayerCard key={player.id} player={player} />)}</div><InfiniteLoadTrigger fetching={query.isFetchingNextPage} hasMore={Boolean(query.hasNextPage)} label="Load more players" onLoad={() => { if (!query.isFetchingNextPage) void query.fetchNextPage(); }} /></> : <StatePanel icon={<Users size={20} />} title="No players match this view" description="Try a broader search or clear one of the active filters." action={activeFilters || filters.search ? <Button variant="quiet" onClick={clear}><RotateCcw size={14} />Clear filters</Button> : undefined} />}
  </main>;
}
