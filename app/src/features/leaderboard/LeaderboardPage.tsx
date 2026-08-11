import { RotateCcw, Trophy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, SearchSelect, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { useDebouncedValue } from "../discovery/hooks";
import { useGames } from "../games/hooks";
import { LeaderboardRow } from "./components/LeaderboardRow";
import { LeaderboardTop } from "./components/LeaderboardTop";
import { useLeaderboard } from "./hooks";
import type { LeaderboardEntityType, LeaderboardFilters, LeaderboardMetric } from "./types";
import { entityTypeLabel, leaderboardMetrics } from "./utils";
import "./leaderboard.css";

const validType = (value: string | null): value is LeaderboardEntityType =>
  value === "users" || value === "teams";
const validMetric = (value: string | null): value is LeaderboardMetric =>
  leaderboardMetrics.some((metric) => metric.value === value);

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-loading" aria-label="Loading leaderboard">
      <div>
        {Array.from({ length: 3 }, (_, index) => (
          <article key={index}>
            <Skeleton height={46} width={46} />
            <SkeletonText lines={3} />
            <Skeleton height={34} width="28%" />
            <Skeleton height={34} />
          </article>
        ))}
      </div>
      <section>
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index}>
            <Skeleton height={40} width={40} />
            <SkeletonText lines={2} />
            <Skeleton height={30} width="18%" />
          </article>
        ))}
      </section>
    </div>
  );
}

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const type = validType(params.get("type"))
    ? (params.get("type") as LeaderboardEntityType)
    : "users";
  const metric = validMetric(params.get("metric"))
    ? (params.get("metric") as LeaderboardMetric)
    : "ranking";
  const game = params.get("game") || "";
  const [gameSearch, setGameSearch] = useState("");
  const debouncedGameSearch = useDebouncedValue(gameSearch, 240);
  const filters = useMemo<LeaderboardFilters>(
    () => ({ type, metric, game: game || undefined }),
    [game, metric, type],
  );
  const query = useLeaderboard(filters);
  const gamesQuery = useGames({ search: debouncedGameSearch || undefined });
  const entities = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const top = entities.slice(0, 3);
  const rows = entities.slice(3);
  const gameOptions = useMemo(() => {
    const options = new Map(
      (gamesQuery.data?.pages.flatMap((page) => page.data) ?? []).map((item) => [item.name, item]),
    );
    if (game && !options.has(game)) options.set(game, { id: game, name: game });
    return Array.from(options.values());
  }, [game, gamesQuery.data]);
  const onGameSearch = useCallback((value: string) => setGameSearch(value), []);
  const change = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params);
      value ? next.set(key, value) : next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );
  const selectType = (value: LeaderboardEntityType) =>
    change("type", value === "users" ? undefined : value);
  const selectMetric = (value: LeaderboardMetric) =>
    change("metric", value === "ranking" ? undefined : value);

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-heading">
        <div>
          <p>Competitive standing</p>
          <h1>Leaderboard</h1>
          <span>Compare verified competitive records across Gamerie.</span>
        </div>
        <div className="leaderboard-entity-switch" aria-label="Leaderboard type">
          <button type="button" aria-pressed={type === "users"} onClick={() => selectType("users")}>
            Players
          </button>
          <button type="button" aria-pressed={type === "teams"} onClick={() => selectType("teams")}>
            Teams
          </button>
        </div>
      </header>
      <nav className="leaderboard-metrics" aria-label="Ranking metric">
        {leaderboardMetrics.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-current={metric === item.value ? "page" : undefined}
            onClick={() => selectMetric(item.value)}
          >
            <span>{item.shortLabel}</span>
          </button>
        ))}
      </nav>
      <section className="leaderboard-context" aria-label="Leaderboard game context">
        <div>
          <p>Game context</p>
          <span>
            {game
              ? `Showing ${entityTypeLabel(type)} connected to ${game}. Rankings use their overall verified competitive record.`
              : `Showing all ranked ${entityTypeLabel(type)} across Gamerie.`}
          </span>
        </div>
        <SearchSelect
          label="Filter by game"
          value={game}
          onChange={(value) => change("game", value || undefined)}
          onSearch={onGameSearch}
          loading={gamesQuery.isLoading}
          loadingMore={gamesQuery.isFetchingNextPage}
          hasMore={gamesQuery.hasNextPage}
          onLoadMore={() => {
            if (!gamesQuery.isFetchingNextPage) void gamesQuery.fetchNextPage();
          }}
          options={gameOptions.map((item) => ({
            value: item.name,
            label: item.name,
            description: item.gameType,
          }))}
          placeholder="All games"
          searchPlaceholder="Search games"
        />
        {game ? (
          <button
            type="button"
            onClick={() => {
              setGameSearch("");
              change("game", undefined);
            }}
          >
            <RotateCcw size={13} />
            Clear game
          </button>
        ) : null}
      </section>
      {!query.isLoading && !query.isError ? (
        <div className="leaderboard-result-line" role="status" aria-live="polite">
          <span>
            {total.toLocaleString()} ranked {entityTypeLabel(type)}
          </span>
          <small>{leaderboardMetrics.find((item) => item.value === metric)?.label}</small>
        </div>
      ) : null}
      {query.isLoading ? (
        <LeaderboardSkeleton />
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="The leaderboard could not load"
          description={getApiErrorMessage(
            query.error,
            "Gamerie could not retrieve competitive standings right now.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : entities.length ? (
        <>
          {top.length ? <LeaderboardTop entities={top} metric={metric} /> : null}
          {rows.length ? (
            <section className="leaderboard-list" aria-label="Leaderboard rankings">
              {rows.map((entity, index) => (
                <LeaderboardRow entity={entity} metric={metric} rank={index + 4} key={entity.id} />
              ))}
            </section>
          ) : null}
          <InfiniteLoadTrigger
            fetching={query.isFetchingNextPage}
            hasMore={Boolean(query.hasNextPage)}
            label={`Load more ${entityTypeLabel(type)}`}
            onLoad={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage();
            }}
          />
        </>
      ) : (
        <StatePanel
          icon={<Trophy size={20} />}
          title="No competitive records in this view"
          description={
            game
              ? `No ranked ${entityTypeLabel(type)} are connected to ${game} yet.`
              : `Ranked ${entityTypeLabel(type)} will appear here as verified match results are recorded.`
          }
          action={
            game ? (
              <Button variant="quiet" onClick={() => change("game", undefined)}>
                <RotateCcw size={14} />
                Show all games
              </Button>
            ) : undefined
          }
        />
      )}
    </main>
  );
}
