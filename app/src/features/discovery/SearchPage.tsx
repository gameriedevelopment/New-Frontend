import { ArrowUpRight, Gamepad2, Search, Shield, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, SafeImage, SkeletonAvatar, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { InfiniteLoadTrigger } from "./components/InfiniteLoadTrigger";
import { useDebouncedValue, useUnifiedSearch } from "./hooks";
import type { SearchEntity, SearchGame, SearchKind, SearchPost, SearchTeam } from "./types";
import type { PlayerProfile } from "../profile/types";
import "./discovery.css";

const tabs: Array<{ id: SearchKind; label: string }> = [
  { id: "posts", label: "Posts" },
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "games", label: "Games" },
];
const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const isPlayer = (item: SearchEntity): item is PlayerProfile => "username" in item;
const isTeam = (item: SearchEntity): item is SearchTeam =>
  "members" in item || ("level" in item && "logo" in item);
const isGame = (item: SearchEntity): item is SearchGame =>
  "gameType" in item || "platforms" in item || "company" in item;

function SearchResult({ item, kind }: { item: SearchEntity; kind: SearchKind }) {
  if (kind === "players" && isPlayer(item))
    return (
      <Link className="search-result search-result--person" to={`/profile/${item.username}`}>
        <SafeImage src={item.profileImage} alt="" />
        <div>
          <p>Player</p>
          <h2>{item.username}</h2>
          <span>{item.gamerTitle || item.gameLevel || "Gamerie player"}</span>
        </div>
        <dl>
          <div
            data-metric="wins"
            data-has-wins={Number(item.stats?.tournamentWins ?? item.stats?.wins ?? 0) > 0}
          >
            <dt>
              <Trophy size={13} />
              Wins
            </dt>
            <dd>{Number(item.stats?.tournamentWins ?? item.stats?.wins ?? 0)}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>{item.gameLevel || "—"}</dd>
          </div>
        </dl>
        <ArrowUpRight size={16} />
      </Link>
    );
  if (kind === "teams" && isTeam(item))
    return (
      <Link
        className="search-result search-result--person"
        to={`/teams/${encodeURIComponent(slug(item.name))}`}
      >
        <SafeImage src={item.logo} fallback="/media-fallback.svg" alt="" />
        <div>
          <p>Team</p>
          <h2>{item.name}</h2>
          <span>{item.description || "Competitive team on Gamerie"}</span>
        </div>
        <dl>
          <div>
            <dt>
              <Users size={13} />
              Members
            </dt>
            <dd>{item.members?.length ?? 0}</dd>
          </div>
          <div data-metric="wins" data-has-wins={Number(item.stats?.tournamentWins ?? 0) > 0}>
            <dt>
              <Trophy size={13} />
              Wins
            </dt>
            <dd>{item.stats?.tournamentWins ?? 0}</dd>
          </div>
        </dl>
        <ArrowUpRight size={16} />
      </Link>
    );
  if (kind === "games" && isGame(item))
    return (
      <Link
        className="search-result search-result--game"
        to={`/games/${encodeURIComponent(item.id)}`}
      >
        <SafeImage
          src={item.banner || item.wallPhoto || item.image}
          fallback="/profile-cover-fallback.jpg"
          alt=""
        />
        <div>
          <p>{item.company || "Game catalogue"}</p>
          <h2>{item.name}</h2>
          <span>{item.genre || item.gameType || "Competitive game"}</span>
          {item.description ? <small>{item.description}</small> : null}
        </div>
        <ArrowUpRight size={16} />
      </Link>
    );
  const post = item as SearchPost;
  return (
    <Link className="search-result search-result--post" to={`/post/${post.id}`}>
      <header>
        <SafeImage src={post.authorImage} alt="" />
        <div>
          <strong>{post.authorName || "Gamerie player"}</strong>
          <span>
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Community post"}
          </span>
        </div>
        <ArrowUpRight size={16} />
      </header>
      <p>{post.content || "Open this post to view the full conversation."}</p>
      {post.tags?.length ? (
        <footer>
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag}>#{tag.replace(/^#/, "")}</span>
          ))}
        </footer>
      ) : null}
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div className="search-results">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="search-result search-result--skeleton" key={index}>
          <SkeletonAvatar size={48} />
          <SkeletonText lines={3} />
        </div>
      ))}
    </div>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialKind = tabs.some((tab) => tab.id === params.get("tab"))
    ? (params.get("tab") as SearchKind)
    : "posts";
  const [input, setInput] = useState(params.get("q") || params.get("tag") || "");
  const debounced = useDebouncedValue(input, 320);
  const kind = initialKind;
  const externalTerm = params.get("q") || params.get("tag") || "";
  const lastSyncedUrlTerm = useRef(externalTerm);
  const pendingExternalTerm = useRef<string | null>(null);

  useEffect(() => {
    if (externalTerm === lastSyncedUrlTerm.current) return;
    lastSyncedUrlTerm.current = externalTerm;
    pendingExternalTerm.current = externalTerm;
    setInput(externalTerm);
  }, [externalTerm]);

  useEffect(() => {
    const normalizedTerm = debounced.trim();
    if (pendingExternalTerm.current !== null) {
      if (normalizedTerm !== pendingExternalTerm.current) return;
      pendingExternalTerm.current = null;
    }
    if (normalizedTerm === externalTerm) return;

    lastSyncedUrlTerm.current = normalizedTerm;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        normalizedTerm ? next.set("q", normalizedTerm) : next.delete("q");
        next.delete("tag");
        return next;
      },
      { replace: true },
    );
  }, [debounced, externalTerm, setParams]);

  const term = externalTerm;
  const query = useUnifiedSearch(kind, term);
  const results = query.data?.pages.flatMap((page) => page.data) ?? [];
  const selectTab = (tab: SearchKind) => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next, { replace: true });
  };
  const prompt = useMemo(
    () =>
      kind === "players"
        ? "Search usernames, player titles, or levels"
        : kind === "teams"
          ? "Search team names, descriptions, or levels"
          : kind === "games"
            ? "Search games, studios, genres, or platforms"
            : "Search posts, authors, topics, or tags",
    [kind],
  );
  return (
    <main className="search-page">
      <header className="search-heading">
        <p>Across Gamerie</p>
        <h1>Search the player network.</h1>
        <span>
          One focused search across conversations, people, teams, and the games connecting them.
        </span>
      </header>
      <section className="search-command">
        <Search size={19} />
        <label>
          <span className="sr-only">Search Gamerie</span>
          <input
            data-global-search
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={prompt}
          />
        </label>
        {query.isFetching && !query.isFetchingNextPage ? (
          <i aria-label="Searching" />
        ) : (
          <kbd>Enter a name or topic</kbd>
        )}
      </section>
      <nav className="search-tabs" aria-label="Search categories">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={kind === tab.id ? "page" : undefined}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {!term ? (
        <StatePanel
          icon={<Search size={20} />}
          title="Start with what you know"
          description="A player name, game, team, hashtag, or phrase is enough to begin."
        />
      ) : query.isLoading ? (
        <ResultsSkeleton />
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="Search could not be completed"
          description={getApiErrorMessage(
            query.error,
            "Gamerie could not search this category right now.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : results.length ? (
        <>
          <div className="search-results">
            {results.map((item) => (
              <SearchResult key={item.id} item={item} kind={kind} />
            ))}
          </div>
          <InfiniteLoadTrigger
            fetching={query.isFetchingNextPage}
            hasMore={Boolean(query.hasNextPage)}
            label="Load more results"
            onLoad={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage();
            }}
          />
        </>
      ) : (
        <StatePanel
          icon={
            kind === "games" ? (
              <Gamepad2 size={20} />
            ) : kind === "teams" ? (
              <Shield size={20} />
            ) : (
              <Search size={20} />
            )
          }
          title={`No ${kind} found`}
          description="Check the spelling or try a broader phrase."
        />
      )}
    </main>
  );
}
