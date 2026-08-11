import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, SafeImage, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { InfiniteLoadTrigger } from "../../discovery/components/InfiniteLoadTrigger";
import { useTeamFollowers } from "../hooks";

export function TeamFollowers({ teamId }: { teamId: string }) {
  const query = useTeamFollowers(teamId, true);
  const followers = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  if (query.isLoading)
    return (
      <section className="community-section">
        <SkeletonText lines={7} />
      </section>
    );
  if (query.isError)
    return (
      <StatePanel
        tone="error"
        title="Followers could not load"
        description={getApiErrorMessage(
          query.error,
          "Gamerie could not retrieve this team’s followers.",
        )}
        action={
          <Button variant="secondary" onClick={() => query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  return (
    <section className="community-section">
      <header>
        <div>
          <h2>Team followers</h2>
          <p>Players keeping up with this team.</p>
        </div>
        <span>
          {total.toLocaleString()} {total === 1 ? "follower" : "followers"}
        </span>
      </header>
      {followers.length ? (
        <>
          <div className="team-follower-grid">
            {followers.map((user) => (
              <Link key={user.id} to={user.username ? `/profile/${user.username}` : "#"}>
                <SafeImage src={user.profileImage} fallback="/avatar-fallback.svg" alt="" />
                <div>
                  <strong>{user.displayName || user.username || "Gamerie player"}</strong>
                  <span>{user.username ? `@${user.username}` : user.gamerTitle || "Player"}</span>
                </div>
              </Link>
            ))}
          </div>
          <InfiniteLoadTrigger
            fetching={query.isFetchingNextPage}
            hasMore={Boolean(query.hasNextPage)}
            label="Load more followers"
            onLoad={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage();
            }}
          />
        </>
      ) : (
        <StatePanel
          icon={<Users size={20} />}
          title="No followers yet"
          description="Players who follow this team will appear here."
        />
      )}
    </section>
  );
}
