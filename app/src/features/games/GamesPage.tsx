import { Gamepad2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { GameCard } from "./components/GameCard";
import { InfiniteGameLoad } from "./components/InfiniteGameLoad";
import { useDebouncedGameValue, useGameFacets, useGames, useGameStatsBatch } from "./hooks";
import type { GameFilters } from "./types";
import "./games.css";

const knownPlatforms = ["PC", "PlayStation", "PS5", "Xbox", "Nintendo Switch", "Mobile"];

function GamesSkeleton() {
  return <div className="game-grid" aria-label="Loading games">{Array.from({ length: 6 }, (_, index) => <div className="game-card game-card--skeleton" key={index}><Skeleton height={188} /><div className="game-card__body"><SkeletonText lines={4} /></div></div>)}</div>;
}

export function GamesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [filtersOpen, setFiltersOpen] = useState(() => ["type", "platform", "followers"].some((key) => params.has(key)));
  const debounced = useDebouncedGameValue(search);
  const change = useCallback((key: string, value?: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  }, [params, setParams]);
  useEffect(() => { if ((params.get("q") || "") !== debounced) change("q", debounced || undefined); }, [change, debounced, params]);
  const filters = useMemo<GameFilters>(() => ({ search: params.get("q") || undefined, gameType: params.get("type") || undefined, platform: params.get("platform") || undefined, minFollowers: params.get("followers") || undefined }), [params]);
  const query = useGames(filters);
  const facets = useGameFacets();
  const games = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const stats = useGameStatsBatch(games.map((game) => game.id));
  const facetGames = facets.data?.data ?? games;
  const types = useMemo(() => Array.from(new Set(facetGames.map((game) => game.gameType).filter((value): value is string => Boolean(value)))).sort(), [facetGames]);
  const dynamicPlatforms = useMemo(() => Array.from(new Set([...knownPlatforms, ...facetGames.flatMap((game) => game.platforms ?? [])])).sort(), [facetGames]);
  const activeFilters = [filters.gameType, filters.platform, filters.minFollowers].filter(Boolean).length;
  const clear = () => { setSearch(""); setFiltersOpen(false); setParams(new URLSearchParams(), { replace: true }); };

  return <main className="games-page">
    <header className="games-heading"><div><p>Games directory</p><h1>Games your network plays.</h1><span>Explore player communities, teams, rankings, achievements, and competitive activity around every title.</span></div></header>
    <section className="games-toolbar" aria-label="Game catalogue filters">
      <div className="games-search"><Search size={17} /><label><span className="sr-only">Search games</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, studios, genres, or descriptions" autoComplete="off" /></label>{query.isFetching && !query.isFetchingNextPage ? <i aria-label="Updating results" /> : null}<button className="games-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="game-catalogue-filters" onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={15} />Filters{activeFilters ? <b>{activeFilters}</b> : null}</button></div>
      <div className="games-filters" id="game-catalogue-filters" hidden={!filtersOpen}><label><span>Type</span><select value={filters.gameType || ""} onChange={(event) => change("type", event.target.value || undefined)}><option value="">All types</option>{types.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Platform</span><select value={filters.platform || ""} onChange={(event) => change("platform", event.target.value || undefined)}><option value="">All platforms</option>{dynamicPlatforms.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Community</span><select value={filters.minFollowers || ""} onChange={(event) => change("followers", event.target.value || undefined)}><option value="">Any size</option><option value="10">10+ players</option><option value="50">50+ players</option><option value="100">100+ players</option><option value="500">500+ players</option></select></label>{activeFilters || filters.search ? <button type="button" onClick={clear}><RotateCcw size={13} />Clear</button> : null}</div>
    </section>
    {!query.isLoading && !query.isError ? <div className="games-result-line"><span>{total.toLocaleString()} {total === 1 ? "title" : "titles"}</span><small>Community activity updates as results load</small></div> : null}
    {query.isLoading ? <GamesSkeleton /> : query.isError ? <StatePanel tone="error" title="The games directory could not load" description={getApiErrorMessage(query.error, "Gamerie could not retrieve the catalogue right now.")} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : games.length ? <><div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} stats={stats.data?.[game.id]} />)}</div><InfiniteGameLoad fetching={query.isFetchingNextPage} hasMore={Boolean(query.hasNextPage)} label="Load more games" onLoad={() => { if (!query.isFetchingNextPage) void query.fetchNextPage(); }} /></> : <StatePanel icon={<Gamepad2 size={20} />} title="No games match this view" description="Try a broader title or clear one of the active filters." action={<Button variant="quiet" onClick={clear}><RotateCcw size={14} />Clear filters</Button>} />}
  </main>;
}
