import { RotateCcw, Search, SlidersHorizontal, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, SearchSelect, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { useDebouncedValue } from "../discovery/hooks";
import { useGames } from "../games/hooks";
import { TournamentCard } from "./components/TournamentCard";
import { useTournamentFacets, useTournaments } from "./hooks";
import type { TournamentFilters, TournamentStatus } from "./types";
import "./tournaments.css";

const statuses: Array<{ value: TournamentStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "In progress" },
  { value: "completed", label: "Completed" },
];
const validStatus = (value: string | null): value is TournamentStatus =>
  statuses.some((status) => status.value === value);

function TournamentSkeleton() {
  return (
    <div className="tournament-grid" aria-label="Loading tournaments">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="tournament-card tournament-card--skeleton" key={index}>
          <Skeleton height={178} />
          <div>
            <Skeleton width="28%" height={9} />
            <Skeleton width="66%" height={24} />
            <SkeletonText lines={3} />
            <Skeleton height={78} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TournamentsPage() {
  const [params, setParams] = useSearchParams();
  const status = validStatus(params.get("status"))
    ? (params.get("status") as TournamentStatus)
    : "active";
  const [search, setSearch] = useState(params.get("q") || "");
  const [gameSearch, setGameSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 280);
  const debouncedGameSearch = useDebouncedValue(gameSearch, 240);
  const [filtersOpen, setFiltersOpen] = useState(() =>
    ["game", "platform", "region", "level", "prize", "size"].some((key) => params.has(key)),
  );
  const change = useCallback(
    (key: string, value?: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          value ? next.set(key, value) : next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  useEffect(() => {
    if ((params.get("q") || "") === debouncedSearch) return;
    change("q", debouncedSearch || undefined);
  }, [change, debouncedSearch, params]);
  const filters = useMemo<TournamentFilters>(
    () => ({
      search: params.get("q") || undefined,
      game: params.get("game") || undefined,
      platform: params.get("platform") || undefined,
      region: params.get("region") || undefined,
      skillLevel: params.get("level") || undefined,
      prizeMin: Number(params.get("prize")) || undefined,
      teamSize: Number(params.get("size")) || undefined,
      status,
    }),
    [params, status],
  );
  const query = useTournaments(filters);
  const facets = useTournamentFacets();
  const gamesQuery = useGames({ search: debouncedGameSearch || undefined });
  const tournaments = query.data?.pages.flatMap((page) => page.tournaments) ?? [];
  const gameOptions = useMemo(
    () =>
      Array.from(
        new Map(
          (gamesQuery.data?.pages.flatMap((page) => page.data) ?? []).map((game) => [
            game.name,
            game,
          ]),
        ).values(),
      ),
    [gamesQuery.data],
  );
  const activeFilters = [
    filters.game,
    filters.platform,
    filters.region,
    filters.skillLevel,
    filters.prizeMin,
    filters.teamSize,
  ].filter(Boolean).length;
  const onGameSearch = useCallback((value: string) => setGameSearch(value), []);
  const clear = () => {
    setSearch("");
    setGameSearch("");
    setFiltersOpen(false);
    const next = new URLSearchParams();
    if (status !== "active") next.set("status", status);
    setParams(next, { replace: true });
  };
  const selectStatus = (value: TournamentStatus) => {
    const next = new URLSearchParams(params);
    value === "active" ? next.delete("status") : next.set("status", value);
    setParams(next, { replace: true });
  };

  return (
    <main className="tournaments-page">
      <header className="tournaments-heading">
        <div>
          <h1>Find your next tournament.</h1>
          <span>
            Browse open competitions, understand the entry requirements, and register with the
            organizer.
          </span>
        </div>
      </header>
      <nav className="tournament-status-tabs" aria-label="Tournament status">
        {statuses.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-current={status === item.value ? "page" : undefined}
            onClick={() => selectStatus(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <section className="tournament-toolbar" aria-label="Tournament directory filters">
        <div className="tournament-search">
          <Search size={17} />
          <label>
            <span className="sr-only">Search tournaments</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tournament, game, organizer, or platform"
              autoComplete="off"
            />
          </label>
          {query.isFetching && !query.isFetchingNextPage ? (
            <i aria-label="Updating results" />
          ) : null}
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="tournament-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={15} />
            Filters{activeFilters ? <b>{activeFilters}</b> : null}
          </button>
        </div>
        <div className="tournament-filters" id="tournament-filters" hidden={!filtersOpen}>
          <SearchSelect
            label="Game"
            value={filters.game || ""}
            onChange={(value) => change("game", value || undefined)}
            onSearch={onGameSearch}
            loading={gamesQuery.isLoading}
            loadingMore={gamesQuery.isFetchingNextPage}
            hasMore={gamesQuery.hasNextPage}
            onLoadMore={() => {
              if (!gamesQuery.isFetchingNextPage) void gamesQuery.fetchNextPage();
            }}
            options={gameOptions.map((game) => ({
              value: game.name,
              label: game.name,
              description: game.gameType,
            }))}
            placeholder="All games"
            searchPlaceholder="Search games"
          />
          <label>
            <span>Host platform</span>
            <select
              value={filters.platform || ""}
              onChange={(event) => change("platform", event.target.value || undefined)}
            >
              <option value="">All hosts</option>
              {(facets.data?.platforms ?? []).map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Region</span>
            <select
              value={filters.region || ""}
              onChange={(event) => change("region", event.target.value || undefined)}
            >
              <option value="">All regions</option>
              {(facets.data?.regions ?? []).map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Skill level</span>
            <select
              value={filters.skillLevel || ""}
              onChange={(event) => change("level", event.target.value || undefined)}
            >
              <option value="">All skill levels</option>
              {(facets.data?.skillLevels ?? []).map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Minimum prize</span>
            <select
              value={filters.prizeMin || ""}
              onChange={(event) => change("prize", event.target.value || undefined)}
            >
              <option value="">Any prize pool</option>
              <option value="100">$100+</option>
              <option value="1000">$1,000+</option>
              <option value="5000">$5,000+</option>
              <option value="10000">$10,000+</option>
            </select>
          </label>
          <label>
            <span>Team size</span>
            <select
              value={filters.teamSize || ""}
              onChange={(event) => change("size", event.target.value || undefined)}
            >
              <option value="">Any team size</option>
              {(facets.data?.teamSizes ?? []).map((size) => (
                <option value={size} key={size}>
                  {size === 1 ? "Solo" : `${size} players`}
                </option>
              ))}
            </select>
          </label>
          {activeFilters || search ? (
            <button type="button" onClick={clear}>
              <RotateCcw size={13} />
              Clear filters
            </button>
          ) : null}
        </div>
      </section>
      {query.isLoading ? (
        <TournamentSkeleton />
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="The tournament directory could not load"
          description={getApiErrorMessage(
            query.error,
            "Gamerie could not retrieve competitions right now.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : tournaments.length ? (
        <>
          <div className="tournament-grid">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
          <InfiniteLoadTrigger
            fetching={query.isFetchingNextPage}
            hasMore={Boolean(query.hasNextPage)}
            label="Load more tournaments"
            onLoad={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage();
            }}
          />
        </>
      ) : (
        <StatePanel
          icon={<Trophy size={20} />}
          title={
            status === "active"
              ? "No active tournaments right now"
              : "No tournaments match this view"
          }
          description={
            status === "active"
              ? "Completed competitions remain available in the archive while new opportunities are being prepared."
              : "Try another status or clear the active filters."
          }
          action={
            status === "active" ? (
              <Button variant="quiet" onClick={() => selectStatus("completed")}>
                View completed tournaments
              </Button>
            ) : (
              <Button variant="quiet" onClick={clear}>
                <RotateCcw size={14} />
                Clear filters
              </Button>
            )
          }
        />
      )}
    </main>
  );
}
