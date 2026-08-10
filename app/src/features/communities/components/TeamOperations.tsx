import {
  Check,
  ChevronRight,
  Gamepad2,
  MailPlus,
  Search,
  ShieldCheck,
  Trophy,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";
import {
  Button,
  SafeImage,
  SkeletonText,
  StatePanel,
} from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useDebouncedValue, useUnifiedSearch } from "../../discovery/hooks";
import type { SearchEntity } from "../../discovery/types";
import type { PlayerProfile } from "../../profile/types";
import {
  useCancelTeamInvite,
  useChangeTeamMember,
  useInviteTeamMember,
  useRemoveTeamMember,
  useRespondTeamRequest,
  useTeamGameRanks,
  useTeamPendingInvites,
  useTeamRequests,
} from "../hooks";
import type {
  CommunityMember,
  TeamRequestSummary,
  TeamSummary,
} from "../types";
import { CommunityDialog } from "./CommunityDialog";
import { SensitiveCommunityOperations } from "./SensitiveCommunityOperations";

const titles = [
  "manager",
  "leader",
  "vice leader",
  "member",
  "coach",
  "scouter",
  "analyst",
  "partner",
];
const isPlayer = (item: SearchEntity): item is PlayerProfile =>
  "username" in item;
const memberUserId = (member: CommunityMember) =>
  member.user?.id || member.userId || member.id || "";
type TeamManageView = "access" | "roster" | "competition" | "ownership";

function Person({ request }: { request: TeamRequestSummary }) {
  const user = request.user;
  return (
    <div className="team-operation-person">
      <SafeImage
        src={user?.profileImage}
        fallback="/avatar-fallback.svg"
        alt=""
      />
      <div>
        <strong>
          {user?.displayName || user?.username || "Gamerie player"}
        </strong>
        <span>
          {user?.username ? `@${user.username}` : request.message || "Player"}
        </span>
      </div>
    </div>
  );
}

export function TeamOperations({
  team,
  slug,
}: {
  team: TeamSummary;
  slug: string;
}) {
  const relationship = team.viewerRelationship;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [params, setParams] = useSearchParams();
  const managementViews: Array<{ value: TeamManageView; label: string }> = [
    { value: "access", label: "Access" },
    { value: "roster", label: "Roster" },
    { value: "competition", label: "Competition" },
    ...(relationship?.isOwner
      ? [{ value: "ownership" as const, label: "Ownership" }]
      : []),
  ];
  const requestedView = params.get("manage") as TeamManageView | null;
  const activeView = managementViews.some(
    (view) => view.value === requestedView,
  )
    ? requestedView!
    : "access";
  const [inviteName, setInviteName] = useState("");
  const [editing, setEditing] = useState<CommunityMember | null>(null);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);
  const [title, setTitle] = useState("member");
  const debouncedName = useDebouncedValue(inviteName.trim(), 260);
  const search = useUnifiedSearch("players", debouncedName);
  const requests = useTeamRequests(
    team.id,
    Boolean(relationship?.canManage) && activeView === "access",
  );
  const invites = useTeamPendingInvites(
    team.id,
    Boolean(relationship?.canManage) && activeView === "access",
  );
  const ranks = useTeamGameRanks(team.id, activeView === "competition");
  const invite = useInviteTeamMember(team.id, slug);
  const respond = useRespondTeamRequest(team.id, slug);
  const cancel = useCancelTeamInvite(team.id, slug);
  const changeMember = useChangeTeamMember(team.id, slug);
  const removeMember = useRemoveTeamMember(team.id, slug);
  const candidates = useMemo(
    () =>
      (search.data?.pages.flatMap((page) => page.data) ?? [])
        .filter(isPlayer)
        .filter((player) => player.id !== currentUserId)
        .slice(0, 6),
    [currentUserId, search.data],
  );
  const roster = team.members ?? [];
  const pendingRequests = (requests.data ?? []).filter(
    (request) => !request.status || request.status === "pending",
  );
  const changeView = (view: TeamManageView) => {
    const next = new URLSearchParams(params);
    view === "access" ? next.delete("manage") : next.set("manage", view);
    setParams(next, { replace: true });
  };
  const moveView = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
      return;
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
    requestAnimationFrame(() =>
      document.getElementById(`team-manage-tab-${nextView}`)?.focus(),
    );
  };

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    const username = inviteName.trim().replace(/^@/, "");
    if (!username || invite.isPending) return;
    invite.mutate(username, { onSuccess: () => setInviteName("") });
  };
  const openEdit = (member: CommunityMember) => {
    setEditing(member);
    setTitle(member.title || "member");
  };
  const saveMember = () => {
    const userId = editing ? memberUserId(editing) : "";
    if (!userId) return;
    changeMember.mutate(
      { userId, role: title === "owner" ? "owner" : "member", title },
      { onSuccess: () => setEditing(null) },
    );
  };

  if (!relationship?.canManage)
    return (
      <StatePanel
        tone="error"
        title="Management access required"
        description="Only the team owner or an active manager can open team operations."
      />
    );
  return (
    <div className="team-operations">
      <div
        className="community-manage-tabs"
        role="tablist"
        aria-label="Team management sections"
      >
        {managementViews.map((view, index) => (
          <button
            id={`team-manage-tab-${view.value}`}
            key={view.value}
            type="button"
            role="tab"
            aria-selected={activeView === view.value}
            aria-controls={`team-manage-panel-${view.value}`}
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
        id="team-manage-panel-access"
        role="tabpanel"
        aria-labelledby="team-manage-tab-access"
        hidden={activeView !== "access"}
      >
      <section className="community-section team-operations__invite">
        <header>
          <div>
            <h2>Invite a player</h2>
            <p>
              Search by username, confirm the player, then send an invitation.
            </p>
          </div>
          <MailPlus size={17} />
        </header>
        <form onSubmit={submitInvite}>
          <label>
            <span className="sr-only">Player username</span>
            <Search size={15} />
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Search a username"
              autoComplete="off"
            />
            <Button
              size="small"
              disabled={!inviteName.trim() || invite.isPending}
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </label>
        </form>
        {debouncedName ? (
          <div className="team-invite-results" aria-live="polite">
            {search.isLoading ? (
              <SkeletonText lines={3} />
            ) : candidates.length ? (
              candidates.map((player) => (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => setInviteName(player.username)}
                >
                  <SafeImage
                    src={player.profileImage}
                    fallback="/avatar-fallback.svg"
                    alt=""
                  />
                  <span>
                    <strong>
                      {player.personalInfo?.fullName || player.username}
                    </strong>
                    <small>@{player.username}</small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))
            ) : (
              <p>
                No matching players found. You can still send an exact username.
              </p>
            )}
          </div>
        ) : null}
        {invite.isError ? (
          <p className="community-action-error" role="alert">
            {getApiErrorMessage(
              invite.error,
              "The invitation could not be sent.",
            )}
          </p>
        ) : invite.isSuccess ? (
          <p className="community-action-success" role="status">
            Invitation sent.
          </p>
        ) : null}
      </section>

      <div className="team-operations__queues">
        <section className="community-section">
          <header>
            <div>
              <h2>Join requests</h2>
              <p>Review players asking to join the roster.</p>
            </div>
            <span>{pendingRequests.length} pending</span>
          </header>
          {requests.isLoading ? (
            <SkeletonText lines={5} />
          ) : requests.isError ? (
            <StatePanel
              tone="error"
              title="Requests could not load"
              description={getApiErrorMessage(
                requests.error,
                "Try this queue again.",
              )}
              action={
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => requests.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : pendingRequests.length ? (
            <div className="team-operation-list">
              {pendingRequests.map((request) => (
                <article key={request.id}>
                  <Person request={request} />
                  {request.message ? <p>{request.message}</p> : null}
                  <div>
                    <Button
                      size="small"
                      variant="quiet"
                      disabled={respond.isPending}
                      onClick={() =>
                        respond.mutate({ requestId: request.id, accept: false })
                      }
                    >
                      <X size={13} />
                      Decline
                    </Button>
                    <Button
                      size="small"
                      disabled={respond.isPending}
                      onClick={() =>
                        respond.mutate({ requestId: request.id, accept: true })
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
            <p className="community-section__empty">
              No join requests need attention.
            </p>
          )}
          {respond.isError ? (
            <p className="community-action-error" role="alert">
              {getApiErrorMessage(
                respond.error,
                "This request could not be updated.",
              )}
            </p>
          ) : null}
        </section>
        <section className="community-section">
          <header>
            <div>
              <h2>Pending invitations</h2>
              <p>Invitations awaiting a player response.</p>
            </div>
            <span>{invites.data?.length ?? 0} pending</span>
          </header>
          {invites.isLoading ? (
            <SkeletonText lines={5} />
          ) : invites.isError ? (
            <StatePanel
              tone="error"
              title="Invitations could not load"
              description={getApiErrorMessage(
                invites.error,
                "Try this queue again.",
              )}
              action={
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => invites.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : invites.data?.length ? (
            <div className="team-operation-list">
              {invites.data.map((request) => (
                <article key={request.id}>
                  <Person request={request} />
                  <Button
                    size="small"
                    variant="quiet"
                    disabled={cancel.isPending}
                    onClick={() =>
                      request.user?.id && cancel.mutate(request.user.id)
                    }
                  >
                    Cancel invite
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <p className="community-section__empty">
              No invitations are waiting.
            </p>
          )}
          {cancel.isError ? (
            <p className="community-action-error" role="alert">
              {getApiErrorMessage(
                cancel.error,
                "This invitation could not be cancelled.",
              )}
            </p>
          ) : null}
        </section>
      </div>

      </div>
      <div
        className="community-manage-panel"
        id="team-manage-panel-roster"
        role="tabpanel"
        aria-labelledby="team-manage-tab-roster"
        hidden={activeView !== "roster"}
      >

      <section className="community-section">
        <header>
          <div>
            <h2>Roster controls</h2>
            <p>
              Owners set titles; owners and managers can remove roster members.
            </p>
          </div>
          <span>{roster.length} members</span>
        </header>
        {roster.length ? (
          <div className="team-roster-controls">
            {roster.map((member, index) => {
              const userId = memberUserId(member);
              const isCreator =
                member.role === "owner" || userId === team.ownerId;
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
                        {member.user?.displayName ||
                          member.user?.username ||
                          "Gamerie player"}
                      </strong>
                      <span>{member.title || member.role || "Member"}</span>
                    </div>
                  </div>
                  {!isCreator ? (
                    <div>
                      {relationship.isOwner ? (
                        <Button
                          size="small"
                          variant="quiet"
                          onClick={() => openEdit(member)}
                        >
                          Edit title
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="quiet"
                        onClick={() => setRemoving(member)}
                      >
                        <UserMinus size={13} />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <span className="team-owner-label">
                      <ShieldCheck size={13} />
                      Owner
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <StatePanel
            title="Roster unavailable"
            description="No roster members were returned for this team."
          />
        )}
      </section>

      </div>
      <div
        className="community-manage-panel"
        id="team-manage-panel-competition"
        role="tabpanel"
        aria-labelledby="team-manage-tab-competition"
        hidden={activeView !== "competition"}
      >

      <div className="team-operations__queues">
        <section className="community-section">
          <header>
            <div>
              <h2>Games and rankings</h2>
              <p>Connected titles and their competitive context.</p>
            </div>
            <Gamepad2 size={17} />
          </header>
          {ranks.isLoading ? (
            <SkeletonText lines={4} />
          ) : ranks.isError ? (
            <p className="community-section__empty">
              Rankings are temporarily unavailable.
            </p>
          ) : ranks.data?.length ? (
            <div className="team-rank-list">
              {ranks.data.map((entry, index) => (
                <div key={entry.id || index}>
                  <span>
                    {typeof entry.game === "string"
                      ? entry.game
                      : entry.game.name}
                  </span>
                  <strong>
                    {entry.rankData?.tier
                      ? `${entry.rankData.tier}${entry.rankData.division ? ` ${entry.rankData.division}` : ""}`
                      : entry.rank
                        ? `#${entry.rank}`
                        : Math.round(entry.rankingScore || 0).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="community-section__empty">
              Connect games from team settings to build competitive rankings.
            </p>
          )}
          <Link
            className="team-operation-link"
            to={`/teams/${encodeURIComponent(slug)}/edit`}
          >
            <Gamepad2 size={14} />
            Manage team games
            <ChevronRight size={14} />
          </Link>
        </section>
        <section className="community-section">
          <header>
            <div>
              <h2>Competition</h2>
              <p>Move from roster preparation into competitive play.</p>
            </div>
            <Trophy size={17} />
          </header>
          <div className="team-competition-links">
            <Link to="/tournaments">
              <span>
                <strong>Tournaments</strong>
                <small>Browse and enter eligible competitions</small>
              </span>
              <ChevronRight size={15} />
            </Link>
            <Link to="/challenges?view=team">
              <span>
                <strong>Challenges</strong>
                <small>Review invitations and scheduled team matches</small>
              </span>
              <ChevronRight size={15} />
            </Link>
            <Link to="/leaderboard">
              <span>
                <strong>Leaderboards</strong>
                <small>Review team standing and game ranks</small>
              </span>
              <ChevronRight size={15} />
            </Link>
            <Link to="/calendar">
              <span>
                <strong>Team calendar</strong>
                <small>Coordinate scheduled competitive activity</small>
              </span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </section>
      </div>

      </div>

      {relationship.isOwner ? (
        <div
          className="community-manage-panel"
          id="team-manage-panel-ownership"
          role="tabpanel"
          aria-labelledby="team-manage-tab-ownership"
          hidden={activeView !== "ownership"}
        >
          <SensitiveCommunityOperations kind="team" item={team} slug={slug} />
        </div>
      ) : null}

      {editing ? (
        <CommunityDialog
          title="Update roster title"
          onClose={() => !changeMember.isPending && setEditing(null)}
        >
          <div className="community-dialog__body">
            <p>
              Choose the responsibility shown for{" "}
              {editing.user?.displayName ||
                editing.user?.username ||
                "this member"}
              .
            </p>
            <label>
              <span>Team title</span>
              <select
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              >
                {titles.map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
            {changeMember.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(
                  changeMember.error,
                  "The member title could not be updated.",
                )}
              </p>
            ) : null}
          </div>
          <footer>
            <Button
              variant="quiet"
              disabled={changeMember.isPending}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button disabled={changeMember.isPending} onClick={saveMember}>
              {changeMember.isPending ? "Saving…" : "Save title"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {removing ? (
        <CommunityDialog
          title="Remove from team?"
          onClose={() => !removeMember.isPending && setRemoving(null)}
        >
          <div className="community-dialog__body">
            <p>
              {removing.user?.displayName ||
                removing.user?.username ||
                "This player"}{" "}
              will lose access to the team roster and its member-only activity.
            </p>
            {removeMember.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(
                  removeMember.error,
                  "The member could not be removed.",
                )}
              </p>
            ) : null}
          </div>
          <footer>
            <Button
              variant="quiet"
              disabled={removeMember.isPending}
              onClick={() => setRemoving(null)}
            >
              Keep member
            </Button>
            <Button
              disabled={removeMember.isPending}
              onClick={() => {
                const userId = memberUserId(removing);
                if (userId)
                  removeMember.mutate(userId, {
                    onSuccess: () => setRemoving(null),
                  });
              }}
            >
              {removeMember.isPending ? "Removing…" : "Remove member"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
    </div>
  );
}
