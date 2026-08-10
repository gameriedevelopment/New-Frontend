import { ArrowLeft, ArrowUpRight, CalendarDays, Gamepad2, Globe2, Search, Shield, Sparkles, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button, SafeImage, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { InfiniteGameLoad } from "./components/InfiniteGameLoad";
import { useActiveGameTeams, useActiveGameUsers, useDebouncedGameValue, useGame, useGameStats, useGridSeries } from "./hooks";
import type { ActiveGameTeam, ActiveGameUser, GridGameKey } from "./types";
import "./games.css";

type GameSection = "overview" | "players" | "teams" | "competitive";
const sections: Array<{ id: GameSection; label: string }> = [{ id: "overview", label: "Overview" }, { id: "players", label: "Players" }, { id: "teams", label: "Teams" }, { id: "competitive", label: "Competitive" }];
const validSections = new Set(sections.map((section) => section.id));
const cleanExternalUrl = (value?: string) => value && /^https?:\/\//i.test(value) ? value : undefined;
const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const asNumber = (value?: number | string) => Number(value ?? 0) || 0;

function resolveGridKey(integrationKey?: string | null, name?: string): GridGameKey | undefined {
  const identity = `${integrationKey || ""} ${name || ""}`.toLowerCase();
  if (identity.includes("dota")) return "dota-2";
  if (identity.includes("cs2") || identity.includes("counter-strike") || identity.includes("counter strike")) return "cs2";
  return undefined;
}

function GameDetailSkeleton() {
  return <main className="game-detail game-detail--loading"><Skeleton height={330} /><div className="game-detail__skeleton-copy"><SkeletonText lines={4} /><Skeleton height={180} /></div></main>;
}

function EmptyList({ kind, clear }: { kind: "players" | "teams"; clear: () => void }) {
  return <StatePanel icon={kind === "players" ? <Users size={20} /> : <Shield size={20} />} title={`No ${kind} found`} description={`No active ${kind} match this view yet. Try removing the search filters.`} action={<Button variant="quiet" onClick={clear}>Clear filters</Button>} />;
}

function PlayerRow({ entry, position }: { entry: ActiveGameUser; position: number }) {
  const user = entry.user;
  const achievements = (user.achievements ?? []).filter((item) => item.isCompleted || item.achievement).slice(0, 3);
  const rank = entry.rankData?.rank || entry.rankData?.tier || entry.skillLevel || "Unranked";
  return <article className="game-ranking-row game-ranking-row--player">
    <span className="game-ranking-row__place">{String(position).padStart(2, "0")}</span>
    <SafeImage src={user.profileImage} alt="" />
    <div className="game-ranking-row__identity"><Link to={`/profile/${user.username}`}>{entry.nickname || entry.gameUsername || user.username}</Link><span>@{user.username}{user.isOnline ? <i>Online</i> : null}</span></div>
    <dl><div><dt>Rank</dt><dd>{rank}</dd></div><div><dt>Rating</dt><dd>{entry.rankData?.rankPoints ?? user.stats?.rankingScore ?? user.stats?.eloRating ?? "—"}</dd></div><div><dt>Win rate</dt><dd>{asNumber(user.stats?.winRate).toFixed(0)}%</dd></div></dl>
    <div className="game-ranking-row__achievements" aria-label={`${user.username}'s achievements`}>{achievements.length ? achievements.map((item, index) => <span title={item.achievement?.title || item.achievement?.name || "Achievement"} key={item.achievementId || index}>{item.achievement?.icon ? <SafeImage src={item.achievement.icon} fallback="/gamerie-logo.svg" alt="" /> : <Trophy size={13} />}</span>) : <small>No badges yet</small>}</div>
    <Link className="game-ranking-row__open" aria-label={`View ${user.username}'s profile`} to={`/profile/${user.username}`}><ArrowUpRight size={16} /></Link>
  </article>;
}

function TeamRow({ team, position }: { team: ActiveGameTeam; position: number }) {
  return <article className="game-ranking-row game-ranking-row--team">
    <span className="game-ranking-row__place">{String(position).padStart(2, "0")}</span>
    <SafeImage src={team.logo} fallback="/avatar-fallback.svg" alt="" />
    <div className="game-ranking-row__identity"><Link to={`/teams/${encodeURIComponent(team.slug || slug(team.name))}`}>{team.name}</Link><span>{[team.region, team.level].filter(Boolean).join(" · ") || "Gamerie team"}</span></div>
    <dl><div><dt>Ranking</dt><dd>{team.stats?.ranking ? `#${team.stats.ranking}` : "—"}</dd></div><div><dt>Win rate</dt><dd>{asNumber(team.stats?.winRate).toFixed(0)}%</dd></div><div><dt>Roster</dt><dd>{team.members?.length ?? 0}</dd></div></dl>
    <Link className="game-ranking-row__open" aria-label={`View ${team.name}`} to={`/teams/${encodeURIComponent(team.slug || slug(team.name))}`}><ArrowUpRight size={16} /></Link>
  </article>;
}

export function GameDetailPage() {
  const { gameId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as GameSection | null;
  const section: GameSection = requested && validSections.has(requested) ? requested : "overview";
  const game = useGame(gameId);
  const stats = useGameStats(gameId);
  const [playerInput, setPlayerInput] = useState("");
  const playerSearch = useDebouncedGameValue(playerInput);
  const [teamInput, setTeamInput] = useState("");
  const teamSearch = useDebouncedGameValue(teamInput);
  const [region, setRegion] = useState("");
  const [minRanking, setMinRanking] = useState("");
  const players = useActiveGameUsers(gameId, playerSearch, section === "players");
  const teams = useActiveGameTeams(gameId, { search: teamSearch, region, minRanking }, section === "teams");
  const gridKey = resolveGridKey(game.data?.integrationKey, game.data?.name);
  const series = useGridSeries(gridKey, section === "competitive");
  const playerRows = players.data?.pages.flatMap((page) => page.data) ?? [];
  const teamRows = teams.data?.pages.flatMap((page) => page.data) ?? [];
  const playerTotal = players.data?.pages[0]?.total ?? stats.data?.usersCount ?? 0;
  const teamTotal = teams.data?.pages[0]?.total ?? stats.data?.teamsCount ?? 0;
  const officialWebsite = cleanExternalUrl(game.data?.officialWebsite);
  const socialLinks = useMemo(() => (game.data?.socialMedia ?? []).filter((item) => cleanExternalUrl(item.url)), [game.data?.socialMedia]);
  const selectSection = (next: GameSection) => { const nextParams = new URLSearchParams(params); next === "overview" ? nextParams.delete("view") : nextParams.set("view", next); setParams(nextParams, { replace: true }); };

  if (game.isLoading) return <GameDetailSkeleton />;
  if (game.isError || !game.data) return <main className="game-detail"><StatePanel tone="error" title="This game could not be opened" description={getApiErrorMessage(game.error, "The title may no longer be available or Gamerie could not reach it.")} action={<Link className="games-link-button" to="/games"><ArrowLeft size={15} />Back to games</Link>} /></main>;
  const title = game.data;

  return <main className="game-detail">
    <Link className="game-detail__back" to="/games"><ArrowLeft size={15} />Games directory</Link>
    <header className="game-hero">
      <SafeImage src={title.wallPhoto} fallback="/profile-cover-fallback.jpg" alt="" />
      <div className="game-hero__shade" />
      <div className="game-hero__content"><p>{title.company || "Game catalogue"} <span /> {title.gameType || "Game"}</p><h1>{title.name}</h1><div>{title.platforms?.map((platform) => <span key={platform}>{platform}</span>)}</div></div>
      {officialWebsite ? <a className="game-hero__website" href={officialWebsite} target="_blank" rel="noreferrer">Official website<ArrowUpRight size={15} /></a> : null}
    </header>
    <section className="game-stat-rail" aria-label={`${title.name} community statistics`}><button type="button" onClick={() => selectSection("players")}><Users size={17} /><span>Active players</span><strong>{stats.isLoading ? "—" : (stats.data?.usersCount ?? 0).toLocaleString()}</strong></button><button type="button" onClick={() => selectSection("teams")}><Shield size={17} /><span>Active teams</span><strong>{stats.isLoading ? "—" : (stats.data?.teamsCount ?? 0).toLocaleString()}</strong></button><div><Gamepad2 size={17} /><span>Game modes</span><strong>{title.gameModes?.length ?? 0}</strong></div><div><Sparkles size={17} /><span>Core skills</span><strong>{title.requiredSkills?.length ?? 0}</strong></div></section>
    <nav className="game-detail__tabs" aria-label="Game details">{sections.map((item) => <button type="button" key={item.id} aria-current={section === item.id ? "page" : undefined} onClick={() => selectSection(item.id)}>{item.label}{item.id === "players" ? <span>{stats.data?.usersCount ?? 0}</span> : item.id === "teams" ? <span>{stats.data?.teamsCount ?? 0}</span> : null}</button>)}</nav>

    {section === "overview" ? <div className="game-overview">
      <section className="game-overview__story"><p>About the game</p><h2>A clear view of the title and its community.</h2><div>{title.description || "No game description has been published yet."}</div></section>
      <aside className="game-overview__facts"><section><p>Ways to play</p><div>{title.gameModes?.length ? title.gameModes.map((mode) => <span key={mode}>{mode}</span>) : <small>No modes listed</small>}</div></section><section><p>Skills that matter</p><div>{title.requiredSkills?.length ? title.requiredSkills.map((skill) => <span key={skill}>{skill}</span>) : <small>No skills listed</small>}</div></section>{socialLinks.length ? <section><p>Official channels</p><div>{socialLinks.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.platform}-${item.url}`}><Globe2 size={13} />{item.platform}<ArrowUpRight size={12} /></a>)}</div></section> : null}</aside>
    </div> : null}

    {section === "players" ? <section className="game-community"><header><div><p>Player rankings</p><h2>Players active in {title.name}</h2><span>Rank, form, and earned achievements in one calm competitive view.</span></div><strong>{playerTotal.toLocaleString()}<small>players</small></strong></header><label className="game-community__search"><Search size={16} /><span className="sr-only">Search active players</span><input value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} placeholder="Search username, platform, level, or in-game name" /></label>{players.isLoading ? <div className="game-ranking-list">{Array.from({ length: 5 }, (_, index) => <Skeleton height={78} key={index} />)}</div> : players.isError ? <StatePanel tone="error" title="Player rankings could not load" description={getApiErrorMessage(players.error, "Active players are unavailable right now.")} action={<Button variant="secondary" onClick={() => players.refetch()}>Try again</Button>} /> : playerRows.length ? <><div className="game-ranking-list">{playerRows.map((entry, index) => <PlayerRow entry={entry} position={index + 1} key={entry.id} />)}</div><InfiniteGameLoad fetching={players.isFetchingNextPage} hasMore={Boolean(players.hasNextPage)} label="Load more players" onLoad={() => { if (!players.isFetchingNextPage) void players.fetchNextPage(); }} /></> : <EmptyList kind="players" clear={() => setPlayerInput("")} />}</section> : null}

    {section === "teams" ? <section className="game-community"><header><div><p>Team rankings</p><h2>Teams competing in {title.name}</h2><span>Find active rosters and compare competitive form without leaving the game space.</span></div><strong>{teamTotal.toLocaleString()}<small>teams</small></strong></header><div className="game-community__filters"><label className="game-community__search"><Search size={16} /><span className="sr-only">Search active teams</span><input value={teamInput} onChange={(event) => setTeamInput(event.target.value)} placeholder="Search team name or description" /></label><label><span>Region</span><input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="All regions" /></label><label><span>Minimum ranking</span><input type="number" min="0" value={minRanking} onChange={(event) => setMinRanking(event.target.value)} placeholder="Any" /></label></div>{teams.isLoading ? <div className="game-ranking-list">{Array.from({ length: 5 }, (_, index) => <Skeleton height={78} key={index} />)}</div> : teams.isError ? <StatePanel tone="error" title="Team rankings could not load" description={getApiErrorMessage(teams.error, "Active teams are unavailable right now.")} action={<Button variant="secondary" onClick={() => teams.refetch()}>Try again</Button>} /> : teamRows.length ? <><div className="game-ranking-list">{teamRows.map((team, index) => <TeamRow team={team} position={index + 1} key={team.id} />)}</div><InfiniteGameLoad fetching={teams.isFetchingNextPage} hasMore={Boolean(teams.hasNextPage)} label="Load more teams" onLoad={() => { if (!teams.isFetchingNextPage) void teams.fetchNextPage(); }} /></> : <EmptyList kind="teams" clear={() => { setTeamInput(""); setRegion(""); setMinRanking(""); }} />}</section> : null}

    {section === "competitive" ? <section className="game-community game-competitive"><header><div><p>Competitive calendar</p><h2>Recent and upcoming pro series</h2><span>{gridKey ? "Verified series context supplied through Gamerie's GRID connection." : "Competitive schedule coverage is currently available for supported titles."}</span></div>{series.data ? <strong>{series.data.totalCount.toLocaleString()}<small>series in window</small></strong> : null}</header>{!gridKey ? <StatePanel icon={<CalendarDays size={20} />} title="Live series context is not available for this title" description="Players, teams, rankings, and community activity remain available above. GRID schedule coverage currently supports CS2 and Dota 2." /> : series.isLoading ? <div className="game-series-list">{Array.from({ length: 5 }, (_, index) => <Skeleton height={92} key={index} />)}</div> : series.isError ? <StatePanel tone="error" title="Competitive series could not load" description={getApiErrorMessage(series.error, "GRID schedule data is temporarily unavailable.")} action={<Button variant="secondary" onClick={() => series.refetch()}>Try again</Button>} /> : series.data?.series.length ? <div className="game-series-list">{series.data.series.map((item) => { const date = new Date(item.startTimeScheduled); return <article key={item.id}><time dateTime={item.startTimeScheduled}><strong>{date.toLocaleDateString(undefined, { day: "2-digit" })}</strong><span>{date.toLocaleDateString(undefined, { month: "short" })}</span></time><div><small>{item.tournament?.name || "Competitive series"}</small><h3>{item.teams.length ? item.teams.map((team) => team.name).join(" vs ") : "Teams to be confirmed"}</h3><span>{date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}{item.format ? ` · ${item.format}` : ""}</span></div></article>; })}</div> : <StatePanel icon={<CalendarDays size={20} />} title="No series in this window" description="There are no verified recent or upcoming series for the next fourteen days." />}</section> : null}
  </main>;
}
