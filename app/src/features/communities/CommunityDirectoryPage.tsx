import {
  ChevronRight,
  Gamepad2,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Button,
  SafeImage,
  SearchSelect,
  Skeleton,
  SkeletonText,
  StatePanel,
} from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { useAuthStore } from "../auth/authStore";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { useGames } from "../games/hooks";
import type { Game } from "../games/types";
import { useCommunityDirectory, useCommunityInvites, useRespondInvite, useUserHubs } from "./hooks";
import { COMMUNITY_REGIONS, TEAM_LEVELS } from "./options";
import type { CommunityFilters, HubSummary, TeamSummary } from "./types";
import "./communities.css";

const slugOf = (item: TeamSummary | HubSummary) =>
  item.slug ||
  item.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const count = (direct?: number, relation?: unknown[]) => direct ?? relation?.length ?? 0;

function DirectorySkeleton() {
  return (
    <div className="community-grid" aria-label="Loading communities">
      {Array.from({ length: 6 }, (_, index) => (
        <article className="community-card community-card--loading" key={index}>
          <Skeleton height={112} />
          <div>
            <Skeleton height={56} width={56} />
            <SkeletonText lines={3} />
          </div>
        </article>
      ))}
    </div>
  );
}

function InviteSummary({ kind }: { kind: "teams" | "hubs" }) {
  const query = useCommunityInvites(kind);
  const action = useRespondInvite(kind === "teams" ? "team" : "hub");
  if (query.isLoading || query.isError || !query.data?.length) return null;
  const invite = query.data[0];
  const item = invite.team || invite.hub;
  return (
    <aside className="community-invite" aria-label={`Pending ${kind} invitations`}>
      <div>
        <span>Pending invitation</span>
        <strong>{item?.name || `A ${kind === "teams" ? "team" : "hub"} invited you`}</strong>
        {query.data.length > 1 ? (
          <small>+{query.data.length - 1} more waiting</small>
        ) : (
          <small>Review it before joining.</small>
        )}
      </div>
      <div>
        <Button
          size="small"
          variant="quiet"
          disabled={action.isPending}
          onClick={() => action.mutate({ id: invite.id, accept: false })}
        >
          Decline
        </Button>
        <Button
          size="small"
          disabled={action.isPending}
          onClick={() => action.mutate({ id: invite.id, accept: true })}
        >
          {action.isPending ? "Updating…" : "Accept"}
        </Button>
      </div>
    </aside>
  );
}

function Card({ kind, item }: { kind: "teams" | "hubs"; item: TeamSummary | HubSummary }) {
  const isTeam = kind === "teams";
  const team = item as TeamSummary;
  const hub = item as HubSummary;
  return (
    <Link className="community-card" to={`/${kind}/${encodeURIComponent(slugOf(item))}`}>
      <div className="community-card__cover">
        <SafeImage src={item.backgroundImage} fallback="/profile-cover-fallback.jpg" alt="" />
        {!isTeam ? <span>{hub.type || "Community hub"}</span> : null}
      </div>
      <div className="community-card__body">
        <SafeImage
          className="community-card__logo"
          src={item.logo}
          fallback="/avatar-fallback.svg"
          alt=""
        />
        <div className="community-card__copy">
          <h2>{item.name}</h2>
          <p>
            {item.description ||
              (isTeam
                ? "A team building its competitive identity on Gamerie."
                : "A space for players, teams, and shared gaming interests.")}
          </p>
        </div>
        <dl>
          <div>
            <dt>
              <Users size={13} />
              {isTeam ? "Members" : "People"}
            </dt>
            <dd>{count(item.membersCount, item.members).toLocaleString()}</dd>
          </div>
          {isTeam ? (
            <div>
              <dt>
                <Shield size={13} /> Level
              </dt>
              <dd>{team.level || "Not set"}</dd>
            </div>
          ) : (
            <div>
              <dt>
                <Shield size={13} /> Teams
              </dt>
              <dd>{count(hub.teamsCount, hub.teams).toLocaleString()}</dd>
            </div>
          )}
          <div>
            <dt>
              <MapPin size={13} /> Region
            </dt>
            <dd>{item.region || item.country || "Global"}</dd>
          </div>
        </dl>
        <footer>
          {item.games?.slice(0, 2).map((game) => (
            <span key={game.id || game.name}>
              <Gamepad2 size={12} />
              {game.name}
            </span>
          ))}
          <i aria-hidden="true">
            <ChevronRight size={16} />
          </i>
        </footer>
      </div>
    </Link>
  );
}

function MyHubCard({ hub, userId }: { hub: HubSummary; userId: string }) {
  const membership = hub.members?.find(
    (member) => member.userId === userId || member.user?.id === userId,
  );
  const role = hub.ownerId === userId ? "Owner" : membership?.title || membership?.role || "Member";
  return (
    <Link className="community-owned-card" to={`/hubs/${encodeURIComponent(slugOf(hub))}`}>
      <SafeImage src={hub.logo} fallback="/avatar-fallback.svg" alt="" />
      <span>
        <strong>{hub.name}</strong>
        <small>
          {role} · {hub.type || "Community"}
        </small>
      </span>
      <span className="community-owned-card__meta">
        {count(hub.membersCount, hub.members).toLocaleString()} members
      </span>
      <ChevronRight size={15} aria-hidden="true" />
    </Link>
  );
}

export function CommunityDirectoryPage({ kind }: { kind: "teams" | "hubs" }) {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [gameSearch, setGameSearch] = useState("");
  const [open, setOpen] = useState(
    ["type", "level", "region", "game"].some((key) => params.has(key)),
  );
  const view = kind === "hubs" && params.get("view") === "mine" ? "mine" : "discover";
  const update = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params);
      value ? next.set(key, value) : next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((params.get("q") || "") !== search) update("q", search || undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [params, search, update]);

  const filters = useMemo<CommunityFilters>(
    () => ({
      search: params.get("q") || undefined,
      type: params.get("type") || undefined,
      level: params.get("level") || undefined,
      region: params.get("region") || undefined,
      game: params.get("game") || undefined,
    }),
    [params],
  );
  const query = useCommunityDirectory(kind, filters, view === "discover");
  const myHubs = useUserHubs(user?.id, kind === "hubs" && view === "mine");
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const active = [filters.type, filters.level, filters.region, filters.game].filter(Boolean).length;
  const gameQuery = useGames({ search: gameSearch }, view === "discover");
  const gameOptions = useMemo(() => {
    const games = gameQuery.data?.pages.flatMap((page) => page.data) ?? [];
    const unique = games.filter(
      (game, index, all) => all.findIndex((entry) => entry.name === game.name) === index,
    );
    if (filters.game && !unique.some((game) => game.name === filters.game)) {
      unique.unshift({ id: filters.game, name: filters.game } as Game);
    }
    return unique.map((game) => ({
      value: game.name,
      label: game.name,
      description: game.gameType || game.company,
    }));
  }, [filters.game, gameQuery.data]);
  const clear = () => {
    setSearch("");
    setOpen(false);
    setParams({}, { replace: true });
  };
  const changeHubView = (nextView: "discover" | "mine") => {
    const next = new URLSearchParams();
    if (nextView === "mine") next.set("view", "mine");
    setSearch("");
    setOpen(false);
    setParams(next, { replace: true });
  };
  const noun = kind === "teams" ? "teams" : "hubs";

  return (
    <main className="community-page">
      <header className="community-heading">
        <div>
          <p>{kind === "teams" ? "Team network" : "Community network"}</p>
          <h1>
            {kind === "teams"
              ? "Find the right team to grow with."
              : "Find spaces worth belonging to."}
          </h1>
          <span>
            {kind === "teams"
              ? "Discover rosters through shared games, region, and level of play."
              : "Explore player communities and organizations built around the games you care about."}
          </span>
        </div>
        <Link className="community-create-link" to={`/${kind}/create`}>
          <Plus size={15} />
          Create {kind === "teams" ? "team" : "hub"}
        </Link>
      </header>
      <InviteSummary kind={kind} />

      {kind === "hubs" ? (
        <nav className="community-directory-views" aria-label="Hub directory views">
          <button
            type="button"
            aria-current={view === "discover" ? "page" : undefined}
            onClick={() => changeHubView("discover")}
          >
            Discover
          </button>
          <button
            type="button"
            aria-current={view === "mine" ? "page" : undefined}
            onClick={() => changeHubView("mine")}
          >
            Your hubs
          </button>
        </nav>
      ) : null}

      {kind === "hubs" && view === "mine" ? (
        <section className="community-owned" aria-labelledby="your-hubs-title">
          <header>
            <div>
              <p>Your communities</p>
              <h2 id="your-hubs-title">Hubs you belong to</h2>
            </div>
          </header>
          {myHubs.isLoading ? (
            <div className="community-owned__loading">
              <SkeletonText lines={5} />
              <SkeletonText lines={5} />
            </div>
          ) : myHubs.isError ? (
            <StatePanel
              tone="error"
              title="Your hubs could not load"
              description={getApiErrorMessage(
                myHubs.error,
                "Gamerie could not retrieve your communities right now.",
              )}
              action={
                <Button variant="secondary" onClick={() => myHubs.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : myHubs.data?.length ? (
            <div className="community-owned__list">
              {myHubs.data.map((hub) => (
                <MyHubCard key={hub.id} hub={hub} userId={user!.id} />
              ))}
            </div>
          ) : (
            <StatePanel
              title="No hubs yet"
              description="Create a hub or join a community and it will remain easy to find here."
              action={<Button onClick={() => changeHubView("discover")}>Discover hubs</Button>}
            />
          )}
        </section>
      ) : (
        <>
          <section className="community-toolbar" data-open={open || undefined}>
            <div className="community-search">
              <Search size={17} />
              <input
                aria-label={`Search ${noun}`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${noun} by name or description`}
              />
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`${kind}-directory-filters`}
                onClick={() => setOpen((value) => !value)}
              >
                <SlidersHorizontal size={15} />
                Filters
                {active ? <b>{active}</b> : null}
              </button>
            </div>
            <div className="community-filters" id={`${kind}-directory-filters`} hidden={!open}>
              {kind === "teams" ? (
                <label>
                  <span>Level</span>
                  <select
                    value={filters.level || ""}
                    onChange={(event) => update("level", event.target.value || undefined)}
                  >
                    <option value="">All levels</option>
                    {TEAM_LEVELS.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span>Type</span>
                  <select
                    value={filters.type || ""}
                    onChange={(event) => update("type", event.target.value || undefined)}
                  >
                    <option value="">All hubs</option>
                    <option value="community">Community</option>
                    <option value="organization">Organization</option>
                  </select>
                </label>
              )}
              <label>
                <span>Region</span>
                <select
                  value={filters.region || ""}
                  onChange={(event) => update("region", event.target.value || undefined)}
                >
                  <option value="">All regions</option>
                  {COMMUNITY_REGIONS.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
              </label>
              <SearchSelect
                label="Game"
                value={filters.game || ""}
                onChange={(value) => update("game", value || undefined)}
                onSearch={setGameSearch}
                loading={gameQuery.isLoading}
                loadingMore={gameQuery.isFetchingNextPage}
                hasMore={gameQuery.hasNextPage}
                onLoadMore={() => {
                  if (!gameQuery.isFetchingNextPage) void gameQuery.fetchNextPage();
                }}
                options={gameOptions}
                placeholder="All games"
                searchPlaceholder="Search games"
                emptyText="No games match"
              />
              {active || filters.search ? (
                <button type="button" onClick={clear}>
                  <RotateCcw size={13} /> Clear
                </button>
              ) : null}
            </div>
          </section>
          {query.isLoading ? (
            <DirectorySkeleton />
          ) : query.isError ? (
            <StatePanel
              tone="error"
              title={`${noun[0].toUpperCase() + noun.slice(1)} could not load`}
              description={getApiErrorMessage(
                query.error,
                "Gamerie could not retrieve this directory right now.",
              )}
              action={
                <Button variant="secondary" onClick={() => query.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : items.length ? (
            <>
              <div className="community-grid">
                {items.map((item) => (
                  <Card key={item.id} kind={kind} item={item} />
                ))}
              </div>
              <InfiniteLoadTrigger
                fetching={query.isFetchingNextPage}
                hasMore={Boolean(query.hasNextPage)}
                label={`Load more ${noun}`}
                onLoad={() => {
                  if (!query.isFetchingNextPage) void query.fetchNextPage();
                }}
              />
            </>
          ) : (
            <StatePanel
              icon={kind === "teams" ? <Shield size={20} /> : <Users size={20} />}
              title={`No ${noun} match this view`}
              description="Try a broader search or clear an active filter."
              action={
                active || filters.search ? (
                  <Button variant="quiet" onClick={clear}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}
    </main>
  );
}
