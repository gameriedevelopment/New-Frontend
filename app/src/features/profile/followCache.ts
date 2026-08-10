type FollowablePlayer = {
  id?: string;
  isFollowedByCurrentUser?: boolean;
  followersCount?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Keeps profile, paginated discovery, and search results in sync during a follow mutation. */
export function updatePlayerFollowCache(value: unknown, profileId: string, wasFollowing: boolean): unknown {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const updated = updatePlayerFollowCache(item, profileId, wasFollowing);
      if (updated !== item) changed = true;
      return updated;
    });
    return changed ? next : value;
  }

  if (!isRecord(value)) return value;
  const player = value as FollowablePlayer;
  if (player.id === profileId) {
    return {
      ...value,
      isFollowedByCurrentUser: !wasFollowing,
      followersCount: Math.max(0, Number(player.followersCount ?? 0) + (wasFollowing ? -1 : 1)),
    };
  }

  let changed = false;
  const next = { ...value };
  for (const key of ["pages", "data", "results", "players"]) {
    if (!(key in value)) continue;
    const updated = updatePlayerFollowCache(value[key], profileId, wasFollowing);
    if (updated !== value[key]) {
      next[key] = updated;
      changed = true;
    }
  }
  return changed ? next : value;
}
