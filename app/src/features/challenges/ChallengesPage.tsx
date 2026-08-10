import { Filter, History, Inbox, Plus, RotateCcw, Search, Shield, Swords } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { useAuthStore } from "../auth/authStore";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { useDebouncedValue } from "../discovery/hooks";
import { useProfileTeams } from "../profile/hooks";
import type { ProfileTeam } from "../profile/types";
import { ChallengeCard } from "./components/ChallengeCard";
import { ChallengeComposer } from "./components/ChallengeComposer";
import { ChallengeDetailSheet } from "./components/ChallengeDetailSheet";
import { useMyChallenges, useUpdateChallenge } from "./hooks";
import type { ChallengeDirection, ChallengeFilters, ChallengeScope, ChallengeStatus, ChallengeType } from "./types";
import "./challenges.css";

const views: Array<{ value: ChallengeScope; label: string; icon: typeof Inbox }> = [
  { value: "for-you", label: "For you", icon: Inbox },
  { value: "team", label: "Team", icon: Shield },
  { value: "history", label: "History", icon: History },
];
const isOwnerTeam = (team: ProfileTeam, userId: string) => team.role === "owner" || team.title === "owner" || Boolean(team.members?.some((member) => (member.userId === userId || member.user?.id === userId) && member.role === "owner"));
const teamId = (team: ProfileTeam) => team.team?.id || team.id || "";

function ChallengeListSkeleton() { return <div className="challenge-list" aria-label="Loading challenges">{Array.from({ length: 5 }, (_, index) => <div className="challenge-card challenge-card--skeleton" key={index}><Skeleton width="18%" height={18} /><SkeletonText lines={2} /><Skeleton height={48} /></div>)}</div>; }

export function ChallengesPage() {
  const user = useAuthStore((state) => state.user);
  const route = useParams<{ challengeId?: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const scope = (views.some((view) => view.value === params.get("view")) ? params.get("view") : "for-you") as ChallengeScope;
  const direction = (["all", "received", "sent"].includes(params.get("direction") || "") ? params.get("direction") : "all") as ChallengeDirection;
  const status = (params.get("status") || "all") as ChallengeStatus | "all";
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebouncedValue(search, 280);
  const [filtersOpen, setFiltersOpen] = useState(() => params.has("direction") || params.has("status"));
  const selectedId = route.challengeId || params.get("challenge") || "";
  const composing = params.has("compose");
  const profiles = useProfileTeams(user?.id || "", Boolean(user?.id));
  const ownedTeams = useMemo(() => (profiles.data || []).filter((team) => isOwnerTeam(team, user?.id || "")), [profiles.data, user?.id]);
  const ownedTeamIds = useMemo(() => ownedTeams.map(teamId).filter(Boolean), [ownedTeams]);
  const filters = useMemo<ChallengeFilters>(() => ({ scope, direction, status, searchTerm: debounced || undefined }), [debounced, direction, scope, status]);
  const query = useMyChallenges(filters);
  const update = useUpdateChallenge();
  const challenges = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const activeFilters = Number(direction !== "all") + Number(status !== "all");
  const change = useCallback((key: string, value?: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); }, [params, setParams]);
  useEffect(() => {
    if ((params.get("q") || "") === debounced) return;
    const next = new URLSearchParams(params);
    debounced ? next.set("q", debounced) : next.delete("q");
    setParams(next, { replace: true });
  }, [debounced, params, setParams]);
  const changeView = (view: ChallengeScope) => { const next = new URLSearchParams(params); view === "for-you" ? next.delete("view") : next.set("view", view); next.delete("status"); next.delete("direction"); next.delete("challenge"); setParams(next, { replace: true }); };
  const clear = () => { setSearch(""); setFiltersOpen(false); const next = new URLSearchParams(params); ["q", "status", "direction"].forEach((key) => next.delete(key)); setParams(next, { replace: true }); };
  const openChallenge = (id: string) => { const next = new URLSearchParams(params); next.set("challenge", id); next.delete("compose"); setParams(next, { replace: true }); };
  const closeOverlay = useCallback(() => { if (route.challengeId) navigate("/challenges"); else { const next = new URLSearchParams(params); ["challenge", "compose", "target", "targetName"].forEach((key) => next.delete(key)); setParams(next, { replace: true }); } }, [navigate, params, route.challengeId, setParams]);
  const openComposer = () => { const next = new URLSearchParams(params); next.set("compose", "user"); next.delete("challenge"); setParams(next, { replace: true }); };
  const initialType: ChallengeType = params.get("compose") === "team" ? "team" : "user";
  return <main className="challenges-page">
    <header className="challenges-heading"><div><p>Competition</p><h1>Challenges</h1><span>Review invitations and scheduled matches.</span></div><Button onClick={openComposer}><Plus size={15} />Create challenge</Button></header>
    <nav className="challenge-views" aria-label="Challenge views">{views.map(({ value, label, icon: Icon }) => <button type="button" key={value} aria-current={scope === value ? "page" : undefined} onClick={() => changeView(value)}><Icon size={15} />{label}</button>)}</nav>
    <section className="challenge-toolbar" aria-label="Challenge filters"><div><Search size={16} /><label><span className="sr-only">Search challenges</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a player, team, or game" /></label><button type="button" aria-expanded={filtersOpen} aria-controls="challenge-filters" onClick={() => setFiltersOpen((open) => !open)}><Filter size={14} />Filters{activeFilters ? <b>{activeFilters}</b> : null}</button></div><div id="challenge-filters" hidden={!filtersOpen}><label><span>Direction</span><select value={direction} onChange={(event) => change("direction", event.target.value === "all" ? undefined : event.target.value)}><option value="all">All directions</option><option value="received">Received</option><option value="sent">Sent</option></select></label>{scope !== "history" ? <label><span>Status</span><select value={status} onChange={(event) => change("status", event.target.value === "all" ? undefined : event.target.value)}><option value="all">Pending and accepted</option><option value="pending">Pending</option><option value="accepted">Accepted</option></select></label> : null}{activeFilters || search ? <button type="button" onClick={clear}><RotateCcw size={13} />Clear</button> : null}</div></section>
    {!query.isLoading && !query.isError ? <div className="challenge-result-line" role="status" aria-live="polite"><span>{total.toLocaleString()} {total === 1 ? "challenge" : "challenges"}</span><small>{scope === "for-you" ? "Your player invitations" : scope === "team" ? "Challenges for teams you own" : "Completed, declined, and expired challenges"}</small></div> : null}
    {query.isLoading ? <ChallengeListSkeleton /> : query.isError ? <StatePanel tone="error" title="Challenges could not load" description={getApiErrorMessage(query.error, "Gamerie could not retrieve your competition inbox.")} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : challenges.length ? <><div className="challenge-list">{challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} currentUserId={user?.id} ownedTeamIds={ownedTeamIds} pending={update.isPending && update.variables?.id === challenge.id} onOpen={() => openChallenge(challenge.id)} onRespond={(nextStatus) => update.mutate({ id: challenge.id, type: challenge.type, updates: { status: nextStatus } })} />)}</div>{update.isError ? <p className="challenge-error" role="alert">{getApiErrorMessage(update.error, "The challenge could not be updated.")}</p> : null}<InfiniteLoadTrigger fetching={query.isFetchingNextPage} hasMore={Boolean(query.hasNextPage)} label="Load more challenges" onLoad={() => { if (!query.isFetchingNextPage) void query.fetchNextPage(); }} /></> : <StatePanel icon={<Swords size={20} />} title={scope === "history" ? "No challenge history yet" : "This challenge view is clear"} description={scope === "team" && !ownedTeams.length ? "Team challenges appear here when you own a team. Create or take ownership of a team to compete as a roster." : "New invitations and scheduled challenges will appear here as your competitive activity grows."} action={<Button onClick={openComposer}><Plus size={14} />Create challenge</Button>} />}
    {selectedId ? <ChallengeDetailSheet id={selectedId} currentUserId={user?.id} ownedTeamIds={ownedTeamIds} onClose={closeOverlay} /> : null}
    {composing && user?.id ? <ChallengeComposer currentUserId={user.id} ownedTeams={ownedTeams} initialType={initialType} initialTargetId={params.get("target") || ""} initialTargetName={params.get("targetName") || ""} onClose={closeOverlay} onCreated={(id) => { const next = new URLSearchParams(params); ["compose", "target", "targetName"].forEach((key) => next.delete(key)); next.set("challenge", id); setParams(next, { replace: true }); }} /> : null}
  </main>;
}
