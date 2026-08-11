import { describe, expect, it } from "vitest";
import { updatePlayerFollowCache } from "./followCache";

describe("updatePlayerFollowCache", () => {
  it("updates a direct profile without mutating it", () => {
    const profile = {
      id: "p1",
      username: "nova",
      followersCount: 4,
      isFollowedByCurrentUser: false,
    };
    const updated = updatePlayerFollowCache(profile, "p1", false) as typeof profile;
    expect(updated).toEqual({ ...profile, followersCount: 5, isFollowedByCurrentUser: true });
    expect(profile.followersCount).toBe(4);
  });

  it("updates a player inside infinite discovery pages", () => {
    const cache = {
      pages: [
        {
          data: [
            { id: "p1", followersCount: 1 },
            { id: "p2", followersCount: 8, isFollowedByCurrentUser: true },
          ],
        },
      ],
    };
    const updated = updatePlayerFollowCache(cache, "p2", true) as typeof cache;
    expect(updated.pages[0].data[1]).toMatchObject({
      followersCount: 7,
      isFollowedByCurrentUser: false,
    });
    expect(updated.pages[0].data[0]).toBe(cache.pages[0].data[0]);
  });

  it("never allows a negative follower count", () => {
    const updated = updatePlayerFollowCache({ id: "p1", followersCount: 0 }, "p1", true) as {
      followersCount: number;
    };
    expect(updated.followersCount).toBe(0);
  });
});
