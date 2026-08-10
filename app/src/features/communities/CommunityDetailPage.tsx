import {
  ArrowLeft,
  Building2,
  Gamepad2,
  Globe2,
  LockKeyhole,
  MapPin,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Button,
  SafeImage,
  Skeleton,
  SkeletonText,
  StatePanel,
} from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { FeedPostCard } from "../newsfeed/components/FeedPostCard";
import { FeedComposer } from "../newsfeed/components/FeedComposer";
import { useHubPostContext, useTeamPostContext } from "../newsfeed/hooks";
import { useAuthStore } from "../auth/authStore";
import "../newsfeed/newsfeed.css";
import { CommunityActions } from "./components/CommunityActions";
import { HubOperations } from "./components/HubOperations";
import { TeamFollowers } from "./components/TeamFollowers";
import { TeamOperations } from "./components/TeamOperations";
import { useCommunityDetail, useCommunityPosts } from "./hooks";
import type {
  CommunityMember,
  CompetitionItem,
  HubSummary,
  TeamSummary,
} from "./types";
import "./communities.css";

type TeamTab =
  | "overview"
  | "roster"
  | "competition"
  | "followers"
  | "posts"
  | "manage";
type HubTab = "overview" | "teams" | "members" | "posts" | "manage";
const teamTabs: Array<{ value: TeamTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "roster", label: "Roster" },
  { value: "competition", label: "Competition" },
  { value: "followers", label: "Followers" },
  { value: "posts", label: "Posts" },
];
const hubTabs: Array<{ value: HubTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "teams", label: "Teams" },
  { value: "members", label: "Members" },
  { value: "posts", label: "Posts" },
];
const amount = (direct?: number, relation?: unknown[]) =>
  direct ?? relation?.length ?? 0;

function DetailSkeleton() {
  return (
    <main className="community-detail" aria-label="Loading community">
      <Skeleton height={238} />
      <div className="community-detail-skeleton">
        <SkeletonText lines={5} />
        <SkeletonText lines={4} />
      </div>
    </main>
  );
}
function Members({ members = [] }: { members?: CommunityMember[] }) {
  return members.length ? (
    <div className="community-member-grid">
      {members.map((member, index) => (
        <Link
          key={member.id || member.user?.id || index}
          to={member.user?.username ? `/profile/${member.user.username}` : "#"}
        >
          <span className="community-member-avatar">
            <SafeImage src={member.user?.profileImage} alt="" />
            {member.user?.isOnline ? <i aria-label="Online" /> : null}
          </span>
          <div>
            <strong>
              {member.user?.displayName ||
                member.user?.username ||
                "Gamerie player"}
            </strong>
            <small>
              {member.title ||
                member.role ||
                member.user?.gamerTitle ||
                "Member"}
            </small>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <StatePanel
      title="No members to show yet"
      description="The roster will appear here as this community grows."
    />
  );
}
function CompetitionList({
  title,
  items = [],
}: {
  title: string;
  items?: CompetitionItem[];
}) {
  return (
    <section className="community-section">
      <header>
        <h2>{title}</h2>
        <span>
          {items.length ? `${items.length} recorded` : "No entries yet"}
        </span>
      </header>
      {items.length ? (
        <div className="community-records">
          {items.map((item, index) => (
            <article key={item.id || index}>
              <Trophy size={15} />
              <div>
                <strong>
                  {item.title || item.name || "Competitive milestone"}
                </strong>
                <p>
                  {item.description ||
                    item.status ||
                    "Recorded on the team profile."}
                </p>
              </div>
              {item.date || item.createdAt ? (
                <time>
                  {new Date(
                    item.date || item.createdAt || "",
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="community-section__empty">
          Nothing has been recorded in this section yet.
        </p>
      )}
    </section>
  );
}
function CommunityPosts({ kind, id }: { kind: "team" | "hub"; id: string }) {
  const query = useCommunityPosts(kind, id, true);
  const user = useAuthStore((state) => state.user);
  const team = useTeamPostContext(kind === "team" ? id : undefined);
  const hub = useHubPostContext(kind === "hub" ? id : undefined);
  const context = kind === "team" ? team.data : hub.data;
  const membership = context?.members?.find(
    (member) =>
      String(member.userId || member.user?.id) === user?.id &&
      (!member.status || member.status === "active"),
  );
  const owner = context?.ownerId === user?.id;
  const canPost = Boolean(owner || membership);
  const role = String(membership?.role || "").toLowerCase();
  const canAnnounce =
    kind === "team" ? owner : owner || ["admin", "manager"].includes(role);
  return (
    <div className="community-posts">
      {canPost ? (
        <FeedComposer
          community={{
            id,
            kind,
            name: context?.name || `this ${kind}`,
            canAnnounce,
          }}
        />
      ) : null}
      {query.isLoading ? (
        <div className="community-post-list">
          <SkeletonText lines={6} />
          <SkeletonText lines={6} />
        </div>
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="Posts could not load"
          description={getApiErrorMessage(
            query.error,
            "Community posts are temporarily unavailable.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : query.data?.length ? (
        <div className="community-post-list">
          {[...query.data]
            .sort(
              (a, b) =>
                Number(Boolean(b.isAnnouncement)) -
                Number(Boolean(a.isAnnouncement)),
            )
            .map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                canDeleteOverride={owner}
              />
            ))}
        </div>
      ) : (
        <StatePanel
          title="No posts yet"
          description={
            canPost
              ? `Start the first conversation in ${context?.name || `this ${kind}`}.`
              : "Updates from this community will appear here."
          }
        />
      )}
    </div>
  );
}

export function CommunityDetailPage({ kind }: { kind: "team" | "hub" }) {
  const { communitySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useCommunityDetail(kind, communitySlug);
  const tabs =
    kind === "team"
      ? [
          ...teamTabs,
          ...(query.data?.viewerRelationship?.canManage
            ? [{ value: "manage" as TeamTab, label: "Manage" }]
            : []),
        ]
      : [
          ...hubTabs,
          ...(query.data?.viewerRelationship?.canManage
            ? [{ value: "manage" as HubTab, label: "Manage" }]
            : []),
        ];
  const requested = params.get("tab");
  const active = tabs.some((tab) => tab.value === requested)
    ? requested!
    : "overview";
  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !query.data)
    return (
      <main className="community-detail">
        <StatePanel
          tone="error"
          title={`${kind === "team" ? "Team" : "Hub"} unavailable`}
          description={getApiErrorMessage(
            query.error,
            "This community page could not be loaded.",
          )}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  const item = query.data;
  const hub = item as HubSummary;
  const team = item as TeamSummary;
  const slug = communitySlug || item.slug || item.id;
  const relationship = item.viewerRelationship;
  const memberCount = amount(item.membersCount, item.members);
  const followerCount = amount(item.followersCount, item.followers);
  if (kind === "hub" && hub.restricted)
    return (
      <main className="community-detail community-detail--restricted">
        <Link className="community-detail__back" to="/hubs">
          <ArrowLeft size={15} />
          Back to hubs
        </Link>
        <section className="community-restricted">
          <div className="community-restricted__visual">
            <SafeImage
              src={hub.backgroundImage}
              fallback="/profile-cover-fallback.jpg"
              alt=""
            />
          </div>
          <SafeImage
            className="community-restricted__logo"
            src={hub.logo}
            fallback="/avatar-fallback.svg"
            alt=""
          />
          <LockKeyhole size={18} />
          <p>Private hub</p>
          <h1>{hub.name}</h1>
          <span>
            {hub.description ||
              "Membership keeps this community’s teams, people, and conversations private."}
          </span>
          <CommunityActions kind="hub" item={hub} slug={slug} />
        </section>
      </main>
    );
  return (
    <main className="community-detail">
      <Link className="community-detail__back" to={`/${kind}s`}>
        <ArrowLeft size={15} />
        Back to {kind}s
      </Link>
      <section className={`community-identity community-identity--${kind}`}>
        <div className="community-identity__cover">
          <SafeImage
            src={item.backgroundImage}
            fallback="/profile-cover-fallback.jpg"
            alt=""
          />
        </div>
        <div className="community-identity__main">
          <SafeImage
            className="community-identity__logo"
            src={item.logo}
            fallback="/avatar-fallback.svg"
            alt=""
          />
          <div className="community-identity__copy">
            <span className="community-identity__eyebrow">
              {kind === "team" ? (
                team.level || "Competitive team"
              ) : (
                <>
                  {hub.type === "organization" ? (
                    <Building2 size={12} />
                  ) : (
                    <Globe2 size={12} />
                  )}
                  {hub.type || "Community hub"}
                </>
              )}
            </span>
            <h1>{item.name}</h1>
            <p>
              {item.description ||
                `This ${kind} is building its identity on Gamerie.`}
            </p>
            <div className="community-identity__meta">
              {item.region || item.country ? (
                <span>
                  <MapPin size={13} />
                  {item.region || item.country}
                </span>
              ) : (
                <span>
                  <Globe2 size={13} />
                  Global
                </span>
              )}
              {kind === "hub" ? (
                <span>
                  {hub.visibility === "private" ? (
                    <LockKeyhole size={13} />
                  ) : (
                    <Globe2 size={13} />
                  )}
                  {hub.visibility || "public"}
                </span>
              ) : (
                item.platforms?.slice(0, 2).map((platform) => (
                  <span key={platform}>
                    <Gamepad2 size={13} />
                    {platform}
                  </span>
                ))
              )}
            </div>
          </div>
          <CommunityActions kind={kind} item={item} slug={slug} />
        </div>
        <div className="community-identity__facts">
          <div>
            <strong>{memberCount.toLocaleString()}</strong>
            <span>Members</span>
          </div>
          {kind === "team" ? (
            <div>
              <strong>
                {Number(team.stats?.tournamentWins || 0).toLocaleString()}
              </strong>
              <span>Tournament wins</span>
            </div>
          ) : (
            <div>
              <strong>
                {amount(hub.teamsCount, hub.teams).toLocaleString()}
              </strong>
              <span>Teams</span>
            </div>
          )}
          <div>
            <strong>{followerCount.toLocaleString()}</strong>
            <span>Followers</span>
          </div>
          {relationship?.role || relationship?.title ? (
            <div className="community-identity__role">
              <strong>{relationship.title || relationship.role}</strong>
              <span>Your role</span>
            </div>
          ) : null}
        </div>
      </section>
      <nav className="community-tabs" aria-label={`${item.name} sections`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-current={active === tab.value ? "page" : undefined}
            onClick={() => {
              const next = new URLSearchParams(params);
              tab.value === "overview"
                ? next.delete("tab")
                : next.set("tab", tab.value);
              setParams(next, { replace: true });
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="community-tab-content">
        {active === "overview" ? (
          <div className="community-overview-grid">
            <section className="community-section community-section--about">
              <header>
                <h2>{kind === "team" ? "About the team" : "About this hub"}</h2>
              </header>
              <p>
                {item.description ||
                  "More details will appear as this community completes its profile."}
              </p>
              {item.games?.length ? (
                <div className="community-tags">
                  {item.games.map((game) => (
                    <span key={game.id || game.name}>
                      <Gamepad2 size={13} />
                      {game.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
            <aside className="community-section">
              <header>
                <h2>
                  {kind === "team" ? "Competitive record" : "Community access"}
                </h2>
              </header>
              <dl className="community-detail-stats">
                {kind === "team" ? (
                  <>
                    <div>
                      <dt>Matches</dt>
                      <dd>
                        {Number(
                          team.stats?.matchesPlayed || 0,
                        ).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Wins</dt>
                      <dd>{Number(team.stats?.wins || 0).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Ranking</dt>
                      <dd>
                        {team.stats?.ranking
                          ? `#${team.stats.ranking}`
                          : "Unranked"}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Join policy</dt>
                      <dd>{hub.joinPolicy || "Request"}</dd>
                    </div>
                    <div>
                      <dt>Visibility</dt>
                      <dd>{hub.visibility || "Public"}</dd>
                    </div>
                    <div>
                      <dt>Region</dt>
                      <dd>{hub.region || hub.country || "Global"}</dd>
                    </div>
                  </>
                )}
              </dl>
            </aside>
          </div>
        ) : null}
        {kind === "team" && active === "roster" ? (
          <section className="community-section">
            <header>
              <div>
                <h2>Team roster</h2>
                <p>The people representing {team.name}.</p>
              </div>
              <span>{memberCount} members</span>
            </header>
            <Members members={team.members} />
          </section>
        ) : null}
        {kind === "team" && active === "competition" ? (
          <div className="community-competition">
            <CompetitionList title="Tournaments" items={team.tournaments} />
            <CompetitionList title="Achievements" items={team.achievements} />
            <CompetitionList title="Milestones" items={team.milestones} />
          </div>
        ) : null}
        {kind === "team" && active === "followers" ? (
          <TeamFollowers teamId={team.id} />
        ) : null}
        {kind === "team" && active === "manage" && relationship?.canManage ? (
          <TeamOperations team={team} slug={slug} />
        ) : null}
        {kind === "hub" && active === "teams" ? (
          <section className="community-section">
            <header>
              <div>
                <h2>Affiliated teams</h2>
                <p>Teams connected to this hub.</p>
              </div>
              <span>{amount(hub.teamsCount, hub.teams)} teams</span>
            </header>
            {hub.teams?.length ? (
              <div className="community-team-list">
                {hub.teams.map((entry) => (
                  <Link
                    to={`/teams/${encodeURIComponent(entry.slug || entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
                    key={entry.id}
                  >
                    <SafeImage
                      src={entry.logo}
                      fallback="/avatar-fallback.svg"
                      alt=""
                    />
                    <div>
                      <strong>{entry.name}</strong>
                      <span>
                        {entry.level || entry.region || "Gamerie team"}
                      </span>
                    </div>
                    <Shield size={15} />
                  </Link>
                ))}
              </div>
            ) : (
              <StatePanel
                title="No affiliated teams yet"
                description="Teams connected to this hub will appear here."
              />
            )}
          </section>
        ) : null}
        {kind === "hub" && active === "members" ? (
          <section className="community-section">
            <header>
              <div>
                <h2>Hub members</h2>
                <p>People who belong to {hub.name}.</p>
              </div>
              <span>{memberCount} members</span>
            </header>
            <Members members={hub.members} />
          </section>
        ) : null}
        {kind === "hub" && active === "manage" && relationship?.canManage ? (
          <HubOperations hub={hub} slug={slug} />
        ) : null}
        {active === "posts" ? (
          <CommunityPosts kind={kind} id={item.id} />
        ) : null}
      </div>
    </main>
  );
}
