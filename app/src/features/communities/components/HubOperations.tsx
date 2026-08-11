import {
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Gamepad2,
  Link2,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";
import { Button, SafeImage, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useDebouncedValue, useUnifiedSearch } from "../../discovery/hooks";
import type { SearchEntity, SearchTeam } from "../../discovery/types";
import type { PlayerProfile } from "../../profile/types";
import {
  useCancelHubTeamInvite,
  useCancelHubUserInvite,
  useChangeHubMember,
  useHubDashboard,
  useHubPendingInvites,
  useHubRequests,
  useHubTeamRequests,
  useInviteHubMember,
  useInviteTeamToHub,
  useRemoveHubMember,
  useRemoveHubTeam,
  useRespondHubRequest,
  useRespondHubTeamRequest,
  useUpdateHubPolicy,
} from "../hooks";
import type {
  CommunityMember,
  HubRequestSummary,
  HubSummary,
  HubTeamRequestSummary,
  TeamSummary,
} from "../types";
import { CommunityDialog } from "./CommunityDialog";
import { SensitiveCommunityOperations } from "./SensitiveCommunityOperations";

const isPlayer = (item: SearchEntity): item is PlayerProfile => "username" in item;
const isTeam = (item: SearchEntity): item is SearchTeam =>
  "name" in item && ("members" in item || "level" in item) && !("username" in item);
const memberUserId = (member: CommunityMember) =>
  member.user?.id || member.userId || member.id || "";
const pending = <T extends { status?: string }>(items?: T[]) =>
  (items ?? []).filter((item) => !item.status || item.status === "pending");
type HubManageView = "people" | "teams" | "access" | "ownership";

async function copyValue(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  }
}

function PlayerIdentity({ request }: { request: HubRequestSummary }) {
  const user = request.user;
  return (
    <div className="team-operation-person">
      <SafeImage src={user?.profileImage} fallback="/avatar-fallback.svg" alt="" />
      <div>
        <strong>{user?.displayName || user?.username || "Gamerie player"}</strong>
        <span>{user?.username ? `@${user.username}` : "Player"}</span>
      </div>
    </div>
  );
}

function TeamIdentity({ request }: { request: HubTeamRequestSummary }) {
  const team = request.team;
  return (
    <div className="hub-team-identity">
      <SafeImage src={team?.logo} fallback="/avatar-fallback.svg" alt="" />
      <div>
        <strong>{team?.name || "Gamerie team"}</strong>
        <span>{team?.level || team?.region || "Competitive team"}</span>
      </div>
    </div>
  );
}

export function HubOperations({ hub, slug }: { hub: HubSummary; slug: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const relationship = hub.viewerRelationship;
  const [params, setParams] = useSearchParams();
  const managementViews: Array<{ value: HubManageView; label: string }> = [
    { value: "people", label: "Members" },
    { value: "teams", label: "Teams" },
    { value: "access", label: "Access & growth" },
    ...(relationship?.isOwner ? [{ value: "ownership" as const, label: "Ownership" }] : []),
  ];
  const requestedView = params.get("manage") as HubManageView | null;
  const activeView = managementViews.some((view) => view.value === requestedView)
    ? requestedView!
    : "people";
  const [playerTerm, setPlayerTerm] = useState("");
  const [teamTerm, setTeamTerm] = useState("");
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [removingMember, setRemovingMember] = useState<CommunityMember | null>(null);
  const [removingTeam, setRemovingTeam] = useState<TeamSummary | null>(null);
  const [role, setRole] = useState("member");
  const [title, setTitle] = useState("player");
  const [visibility, setVisibility] = useState(hub.visibility || "public");
  const [joinPolicy, setJoinPolicy] = useState(hub.joinPolicy || "request");
  const [copied, setCopied] = useState(false);
  const debouncedPlayer = useDebouncedValue(playerTerm.trim(), 260);
  const debouncedTeam = useDebouncedValue(teamTerm.trim(), 260);
  const playerSearch = useUnifiedSearch("players", debouncedPlayer);
  const teamSearch = useUnifiedSearch("teams", debouncedTeam);
  const requests = useHubRequests(
    hub.id,
    Boolean(relationship?.canManage) && activeView === "people",
  );
  const teamRequests = useHubTeamRequests(
    hub.id,
    Boolean(relationship?.canManage) && activeView === "teams",
  );
  const invites = useHubPendingInvites(
    hub.id,
    Boolean(relationship?.canManage) && (activeView === "people" || activeView === "teams"),
  );
  const dashboard = useHubDashboard(
    hub.id,
    Boolean(relationship?.canManage) && activeView === "access",
  );
  const invitePlayer = useInviteHubMember(hub.id, slug);
  const inviteTeam = useInviteTeamToHub(hub.id, slug);
  const respondPlayer = useRespondHubRequest(hub.id, slug);
  const respondTeam = useRespondHubTeamRequest(hub.id, slug);
  const cancelPlayer = useCancelHubUserInvite(hub.id, slug);
  const cancelTeam = useCancelHubTeamInvite(hub.id, slug);
  const changeMember = useChangeHubMember(hub.id, slug);
  const removeMember = useRemoveHubMember(hub.id, slug);
  const removeTeam = useRemoveHubTeam(hub.id, slug);
  const updatePolicy = useUpdateHubPolicy(hub.id, slug);
  const affiliatedIds = new Set((hub.teams ?? []).map((team) => team.id));
  const playerCandidates = useMemo(
    () =>
      (playerSearch.data?.pages.flatMap((page) => page.data) ?? [])
        .filter(isPlayer)
        .filter((player) => player.id !== currentUserId)
        .filter((player) => !(invites.data?.userIds || []).includes(player.id))
        .slice(0, 6),
    [currentUserId, invites.data?.userIds, playerSearch.data],
  );
  const teamCandidates = useMemo(
    () =>
      (teamSearch.data?.pages.flatMap((page) => page.data) ?? [])
        .filter(isTeam)
        .filter(
          (team) => !affiliatedIds.has(team.id) && !(invites.data?.teamIds || []).includes(team.id),
        )
        .slice(0, 6),
    [affiliatedIds, invites.data?.teamIds, teamSearch.data],
  );
  const playerRequests = pending(requests.data);
  const affiliationRequests = pending(teamRequests.data);
  const members = hub.members ?? [];
  const teams = hub.teams ?? [];
  const changeView = (view: HubManageView) => {
    const next = new URLSearchParams(params);
    view === "people" ? next.delete("manage") : next.set("manage", view);
    setParams(next, { replace: true });
  };
  const moveView = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = managementViews.length - 1;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowRight"
            ? index === last
              ? 0
              : index + 1
            : index === 0
              ? last
              : index - 1;
    const nextView = managementViews[nextIndex].value;
    changeView(nextView);
    requestAnimationFrame(() => document.getElementById(`hub-manage-tab-${nextView}`)?.focus());
  };

  const openMember = (member: CommunityMember) => {
    setEditingMember(member);
    setRole(member.role || "member");
    setTitle(member.title || "player");
  };
  const saveMember = () => {
    const userId = editingMember ? memberUserId(editingMember) : "";
    if (userId)
      changeMember.mutate({ userId, role, title }, { onSuccess: () => setEditingMember(null) });
  };
  const copyReferral = async () => {
    const code = dashboard.data?.referral.code;
    if (!code || !(await copyValue(code))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  if (!relationship?.canManage)
    return (
      <StatePanel
        tone="error"
        title="Hub administration required"
        description="Only the hub owner or an active administrator can open these operations."
      />
    );
  return (
    <div className="hub-operations">
      <div className="community-manage-tabs" role="tablist" aria-label="Hub management sections">
        {managementViews.map((view, index) => (
          <button
            id={`hub-manage-tab-${view.value}`}
            key={view.value}
            type="button"
            role="tab"
            aria-selected={activeView === view.value}
            aria-controls={`hub-manage-panel-${view.value}`}
            tabIndex={activeView === view.value ? 0 : -1}
            onClick={() => changeView(view.value)}
            onKeyDown={(event) => moveView(event, index)}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div
        className="community-manage-panel"
        id="hub-manage-panel-people"
        role="tabpanel"
        aria-labelledby="hub-manage-tab-people"
        hidden={activeView !== "people"}
      >
        <section className="community-section hub-operations__invite" id="hub-people">
          <header>
            <div>
              <h2>Invite people</h2>
              <p>Find the exact player before inviting them into this hub.</p>
            </div>
            <Users size={17} />
          </header>
          <label className="hub-operation-search">
            <Search size={15} />
            <span className="sr-only">Search players</span>
            <input
              value={playerTerm}
              onChange={(event) => setPlayerTerm(event.target.value)}
              placeholder="Search players by username"
              autoComplete="off"
            />
          </label>
          {debouncedPlayer ? (
            <div className="hub-candidate-list" aria-live="polite">
              {playerSearch.isLoading ? (
                <SkeletonText lines={3} />
              ) : playerCandidates.length ? (
                playerCandidates.map((player) => (
                  <article key={player.id}>
                    <SafeImage src={player.profileImage} fallback="/avatar-fallback.svg" alt="" />
                    <div>
                      <strong>{player.personalInfo?.fullName || player.username}</strong>
                      <span>@{player.username}</span>
                    </div>
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={invitePlayer.isPending}
                      onClick={() =>
                        invitePlayer.mutate(
                          { userId: player.id },
                          { onSuccess: () => setPlayerTerm("") },
                        )
                      }
                    >
                      {invitePlayer.isPending ? "Inviting…" : "Invite"}
                    </Button>
                  </article>
                ))
              ) : (
                <p>No available player matches this search.</p>
              )}
            </div>
          ) : null}
          {invitePlayer.isError ? (
            <p className="community-action-error" role="alert">
              {getApiErrorMessage(invitePlayer.error, "This player could not be invited.")}
            </p>
          ) : invitePlayer.isSuccess ? (
            <p className="community-action-success" role="status">
              Player invitation sent.
            </p>
          ) : null}
        </section>

        <div className="hub-operations__split" id="hub-requests">
          <section className="community-section">
            <header>
              <div>
                <h2>Player requests</h2>
                <p>People asking to become hub members.</p>
              </div>
              <span>{playerRequests.length} pending</span>
            </header>
            {requests.isLoading ? (
              <SkeletonText lines={5} />
            ) : requests.isError ? (
              <StatePanel
                tone="error"
                title="Player requests could not load"
                description={getApiErrorMessage(requests.error, "Try this queue again.")}
                action={
                  <Button size="small" variant="secondary" onClick={() => requests.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : playerRequests.length ? (
              <div className="team-operation-list">
                {playerRequests.map((request) => (
                  <article key={request.id}>
                    <PlayerIdentity request={request} />
                    {request.message ? <p>{request.message}</p> : null}
                    <div>
                      <Button
                        size="small"
                        variant="quiet"
                        disabled={respondPlayer.isPending}
                        onClick={() =>
                          respondPlayer.mutate({
                            requestId: request.id,
                            accept: false,
                          })
                        }
                      >
                        <X size={13} />
                        Decline
                      </Button>
                      <Button
                        size="small"
                        disabled={respondPlayer.isPending}
                        onClick={() =>
                          respondPlayer.mutate({
                            requestId: request.id,
                            accept: true,
                          })
                        }
                      >
                        <Check size={13} />
                        Accept
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-section__empty">No player requests need attention.</p>
            )}
            {respondPlayer.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(respondPlayer.error, "This request could not be updated.")}
              </p>
            ) : null}
          </section>
          <section className="community-section">
            <header>
              <div>
                <h2>Pending player invites</h2>
                <p>Invitations awaiting a player response.</p>
              </div>
              <span>{invites.data?.users.length ?? 0} pending</span>
            </header>
            {invites.isLoading ? (
              <SkeletonText lines={5} />
            ) : invites.isError ? (
              <StatePanel
                tone="error"
                title="Player invitations could not load"
                description={getApiErrorMessage(invites.error, "Try this queue again.")}
                action={
                  <Button size="small" variant="secondary" onClick={() => invites.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : invites.data?.users.length ? (
              <div className="team-operation-list">
                {invites.data.users.map((request) => (
                  <article key={request.id}>
                    <PlayerIdentity request={request} />
                    <Button
                      size="small"
                      variant="quiet"
                      disabled={cancelPlayer.isPending}
                      onClick={() => request.user?.id && cancelPlayer.mutate(request.user.id)}
                    >
                      Cancel invite
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-section__empty">No player invitations are waiting.</p>
            )}
          </section>
        </div>

        <section className="community-section" id="hub-members">
          <header>
            <div>
              <h2>Member roles</h2>
              <p>
                Keep operational responsibility clear without making the roster feel bureaucratic.
              </p>
            </div>
            <span>{members.length} members</span>
          </header>
          {members.length ? (
            <div className="hub-member-controls">
              {members.map((member, index) => {
                const userId = memberUserId(member);
                const isOwner = member.role === "owner" || userId === hub.ownerId;
                const protectedAdmin = relationship.role === "admin" && member.role === "admin";
                return (
                  <article key={userId || index}>
                    <div className="team-operation-person">
                      <SafeImage
                        src={member.user?.profileImage}
                        fallback="/avatar-fallback.svg"
                        alt=""
                      />
                      <div>
                        <strong>
                          {member.user?.displayName || member.user?.username || "Gamerie player"}
                        </strong>
                        <span>
                          {member.role || "member"} · {member.title || "player"}
                        </span>
                      </div>
                    </div>
                    {isOwner ? (
                      <span className="team-owner-label">
                        <ShieldCheck size={13} />
                        Owner
                      </span>
                    ) : protectedAdmin ? (
                      <span className="hub-protected-label">Owner managed</span>
                    ) : (
                      <div>
                        <Button size="small" variant="quiet" onClick={() => openMember(member)}>
                          Role
                        </Button>
                        <Button
                          size="small"
                          variant="quiet"
                          onClick={() => setRemovingMember(member)}
                        >
                          <UserMinus size={13} />
                          Remove
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <StatePanel
              title="No members to manage"
              description="Members appear here after joining or accepting an invitation."
            />
          )}
        </section>
      </div>
      <div
        className="community-manage-panel"
        id="hub-manage-panel-teams"
        role="tabpanel"
        aria-labelledby="hub-manage-tab-teams"
        hidden={activeView !== "teams"}
      >
        <section className="community-section hub-operations__invite" id="hub-teams">
          <header>
            <div>
              <h2>Invite a team</h2>
              <p>Connect an established team to this hub.</p>
            </div>
            <Gamepad2 size={17} />
          </header>
          <label className="hub-operation-search">
            <Search size={15} />
            <span className="sr-only">Search teams</span>
            <input
              value={teamTerm}
              onChange={(event) => setTeamTerm(event.target.value)}
              placeholder="Search teams by name"
              autoComplete="off"
            />
          </label>
          {debouncedTeam ? (
            <div className="hub-candidate-list" aria-live="polite">
              {teamSearch.isLoading ? (
                <SkeletonText lines={3} />
              ) : teamCandidates.length ? (
                teamCandidates.map((team) => (
                  <article key={team.id}>
                    <SafeImage src={team.logo} fallback="/avatar-fallback.svg" alt="" />
                    <div>
                      <strong>{team.name}</strong>
                      <span>{team.level || `${team.members?.length || 0} members`}</span>
                    </div>
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={inviteTeam.isPending}
                      onClick={() =>
                        inviteTeam.mutate({ teamId: team.id }, { onSuccess: () => setTeamTerm("") })
                      }
                    >
                      {inviteTeam.isPending ? "Inviting…" : "Invite"}
                    </Button>
                  </article>
                ))
              ) : (
                <p>No available team matches this search.</p>
              )}
            </div>
          ) : null}
          {inviteTeam.isError ? (
            <p className="community-action-error" role="alert">
              {getApiErrorMessage(inviteTeam.error, "This team could not be invited.")}
            </p>
          ) : inviteTeam.isSuccess ? (
            <p className="community-action-success" role="status">
              Team invitation sent.
            </p>
          ) : null}
        </section>

        <div className="hub-operations__split">
          <section className="community-section">
            <header>
              <div>
                <h2>Team requests</h2>
                <p>Teams asking to affiliate with this hub.</p>
              </div>
              <span>{affiliationRequests.length} pending</span>
            </header>
            {teamRequests.isLoading ? (
              <SkeletonText lines={5} />
            ) : teamRequests.isError ? (
              <StatePanel
                tone="error"
                title="Team requests could not load"
                description={getApiErrorMessage(teamRequests.error, "Try this queue again.")}
                action={
                  <Button size="small" variant="secondary" onClick={() => teamRequests.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : affiliationRequests.length ? (
              <div className="team-operation-list">
                {affiliationRequests.map((request) => (
                  <article key={request.id}>
                    <TeamIdentity request={request} />
                    {request.message ? <p>{request.message}</p> : null}
                    <div>
                      <Button
                        size="small"
                        variant="quiet"
                        disabled={respondTeam.isPending}
                        onClick={() =>
                          respondTeam.mutate({
                            requestId: request.id,
                            accept: false,
                          })
                        }
                      >
                        <X size={13} />
                        Decline
                      </Button>
                      <Button
                        size="small"
                        disabled={respondTeam.isPending}
                        onClick={() =>
                          respondTeam.mutate({
                            requestId: request.id,
                            accept: true,
                          })
                        }
                      >
                        <Check size={13} />
                        Approve
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-section__empty">No team requests need attention.</p>
            )}
          </section>
          <section className="community-section">
            <header>
              <div>
                <h2>Pending team invites</h2>
                <p>Hub invitations awaiting a team owner.</p>
              </div>
              <span>{invites.data?.teams.length ?? 0} pending</span>
            </header>
            {invites.isLoading ? (
              <SkeletonText lines={5} />
            ) : invites.isError ? (
              <StatePanel
                tone="error"
                title="Team invitations could not load"
                description={getApiErrorMessage(invites.error, "Try this queue again.")}
                action={
                  <Button size="small" variant="secondary" onClick={() => invites.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : invites.data?.teams.length ? (
              <div className="team-operation-list">
                {invites.data.teams.map((request) => (
                  <article key={request.id}>
                    <TeamIdentity request={request} />
                    <Button
                      size="small"
                      variant="quiet"
                      disabled={cancelTeam.isPending}
                      onClick={() => request.team?.id && cancelTeam.mutate(request.team.id)}
                    >
                      Cancel invite
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-section__empty">No team invitations are waiting.</p>
            )}
          </section>
        </div>

        <section className="community-section">
          <header>
            <div>
              <h2>Affiliated teams</h2>
              <p>Teams currently represented inside this hub.</p>
            </div>
            <span>{teams.length} teams</span>
          </header>
          {teams.length ? (
            <div className="hub-affiliated-grid">
              {teams.map((team) => (
                <article key={team.id}>
                  <Link to={`/teams/${encodeURIComponent(team.slug || team.name)}`}>
                    <SafeImage src={team.logo} fallback="/avatar-fallback.svg" alt="" />
                    <span>
                      <strong>{team.name}</strong>
                      <small>{team.level || team.region || "Gamerie team"}</small>
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                  <Button size="small" variant="quiet" onClick={() => setRemovingTeam(team)}>
                    Remove
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <StatePanel
              title="No affiliated teams yet"
              description="Approved teams will appear here."
            />
          )}
        </section>
      </div>
      <div
        className="community-manage-panel"
        id="hub-manage-panel-access"
        role="tabpanel"
        aria-labelledby="hub-manage-tab-access"
        hidden={activeView !== "access"}
      >
        <div className="hub-operations__split">
          <section className="community-section" id="hub-policy">
            <header>
              <div>
                <h2>Membership policy</h2>
                <p>Define who can see and join the hub.</p>
              </div>
              <Link2 size={17} />
            </header>
            {relationship.isOwner ? (
              <form
                className="hub-policy-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  updatePolicy.mutate({ visibility, joinPolicy });
                }}
              >
                <label>
                  <span>Visibility</span>
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>
                <label>
                  <span>Joining</span>
                  <select
                    value={joinPolicy}
                    onChange={(event) => setJoinPolicy(event.target.value)}
                  >
                    <option value="open">Open membership</option>
                    <option value="request">Approval required</option>
                  </select>
                </label>
                <Button
                  size="small"
                  disabled={
                    updatePolicy.isPending ||
                    (visibility === hub.visibility && joinPolicy === hub.joinPolicy)
                  }
                >
                  {updatePolicy.isPending ? "Saving…" : "Save policy"}
                </Button>
                {updatePolicy.isError ? (
                  <p className="community-action-error" role="alert">
                    {getApiErrorMessage(
                      updatePolicy.error,
                      "The membership policy could not be saved.",
                    )}
                  </p>
                ) : null}
              </form>
            ) : (
              <div className="hub-policy-readonly">
                <div>
                  <span>Visibility</span>
                  <strong>{hub.visibility || "public"}</strong>
                </div>
                <div>
                  <span>Joining</span>
                  <strong>
                    {hub.joinPolicy === "open" ? "Open membership" : "Approval required"}
                  </strong>
                </div>
                <p>Only the hub owner can change access policy.</p>
              </div>
            )}
          </section>
          <section className="community-section" id="hub-growth">
            <header>
              <div>
                <h2>Growth and referrals</h2>
                <p>A concise operational view of community health.</p>
              </div>
              <BarChart3 size={17} />
            </header>
            {dashboard.isLoading ? (
              <SkeletonText lines={7} />
            ) : dashboard.isError ? (
              <StatePanel
                tone="error"
                title="Growth data could not load"
                description={getApiErrorMessage(dashboard.error, "Try this dashboard again.")}
                action={
                  <Button size="small" variant="secondary" onClick={() => dashboard.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : dashboard.data ? (
              <>
                <div className="hub-growth-metrics">
                  <div>
                    <strong>{dashboard.data.community.members.toLocaleString()}</strong>
                    <span>Members</span>
                  </div>
                  <div>
                    <strong>{dashboard.data.community.teams.toLocaleString()}</strong>
                    <span>Teams</span>
                  </div>
                  <div>
                    <strong>{dashboard.data.community.posts.toLocaleString()}</strong>
                    <span>Posts</span>
                  </div>
                  <div>
                    <strong>{dashboard.data.referral.totalSignups.toLocaleString()}</strong>
                    <span>Referred</span>
                  </div>
                </div>
                <div className="hub-growth-chart" aria-label="New members over the last 30 days">
                  {dashboard.data.growth.memberGrowth.map((point) => {
                    const peak = Math.max(
                      1,
                      ...dashboard.data!.growth.memberGrowth.map((entry) => entry.count),
                    );
                    return (
                      <i
                        key={point.date}
                        style={{
                          height: `${Math.max(8, (point.count / peak) * 100)}%`,
                        }}
                        title={`${point.date}: ${point.count}`}
                      />
                    );
                  })}
                </div>
                <div className="hub-referral-code">
                  <span>
                    <small>Referral code</small>
                    <strong>{dashboard.data.referral.code || "Not available"}</strong>
                  </span>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={!dashboard.data.referral.code}
                    onClick={copyReferral}
                  >
                    {copied ? (
                      <>
                        <Check size={13} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>

      {relationship.isOwner ? (
        <div
          className="community-manage-panel"
          id="hub-manage-panel-ownership"
          role="tabpanel"
          aria-labelledby="hub-manage-tab-ownership"
          hidden={activeView !== "ownership"}
        >
          <SensitiveCommunityOperations kind="hub" item={hub} slug={slug} />
        </div>
      ) : null}

      {editingMember ? (
        <CommunityDialog
          title="Update member responsibility"
          onClose={() => !changeMember.isPending && setEditingMember(null)}
        >
          <div className="community-dialog__body">
            <p>
              Role controls administrative access. Title describes the member’s function inside the
              hub.
            </p>
            <label>
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                {relationship.isOwner ? <option value="admin">Admin</option> : null}
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
            </label>
            <label>
              <span>Title</span>
              <select value={title} onChange={(event) => setTitle(event.target.value)}>
                <option value="player">Player</option>
                <option value="coach">Coach</option>
                <option value="manager">Manager</option>
              </select>
            </label>
            {changeMember.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(changeMember.error, "This member could not be updated.")}
              </p>
            ) : null}
          </div>
          <footer>
            <Button
              variant="quiet"
              disabled={changeMember.isPending}
              onClick={() => setEditingMember(null)}
            >
              Cancel
            </Button>
            <Button disabled={changeMember.isPending} onClick={saveMember}>
              {changeMember.isPending ? "Saving…" : "Save member"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {removingMember ? (
        <CommunityDialog
          title="Remove hub member?"
          onClose={() => !removeMember.isPending && setRemovingMember(null)}
        >
          <div className="community-dialog__body">
            <p>
              {removingMember.user?.displayName || removingMember.user?.username || "This player"}{" "}
              will lose access to member-only hub activity.
            </p>
            {removeMember.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(removeMember.error, "The member could not be removed.")}
              </p>
            ) : null}
          </div>
          <footer>
            <Button
              variant="quiet"
              disabled={removeMember.isPending}
              onClick={() => setRemovingMember(null)}
            >
              Keep member
            </Button>
            <Button
              disabled={removeMember.isPending}
              onClick={() => {
                const userId = memberUserId(removingMember);
                if (userId)
                  removeMember.mutate(userId, {
                    onSuccess: () => setRemovingMember(null),
                  });
              }}
            >
              {removeMember.isPending ? "Removing…" : "Remove member"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {removingTeam ? (
        <CommunityDialog
          title="Remove affiliated team?"
          onClose={() => !removeTeam.isPending && setRemovingTeam(null)}
        >
          <div className="community-dialog__body">
            <p>
              {removingTeam.name} will no longer appear as an affiliated team in this hub. The team
              itself will not be deleted.
            </p>
            {removeTeam.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(
                  removeTeam.error,
                  "The team could not be removed from this hub.",
                )}
              </p>
            ) : null}
          </div>
          <footer>
            <Button
              variant="quiet"
              disabled={removeTeam.isPending}
              onClick={() => setRemovingTeam(null)}
            >
              Keep team
            </Button>
            <Button
              disabled={removeTeam.isPending}
              onClick={() =>
                removeTeam.mutate(removingTeam.id, {
                  onSuccess: () => setRemovingTeam(null),
                })
              }
            >
              {removeTeam.isPending ? "Removing…" : "Remove team"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
    </div>
  );
}
