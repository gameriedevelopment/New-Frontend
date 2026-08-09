import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { patchPostCacheValue, patchPostCaches, restorePostCaches, snapshotPostCaches } from "./cache";
import type { FeedPage, FeedPost } from "./types";

const post = (overrides: Partial<FeedPost> = {}): FeedPost => ({ id: "post-1", content: "Original", likesCount: 2, ...overrides });

describe("newsfeed post cache interactions", () => {
  it("patches feed pages, single posts, and embedded reposts consistently", () => {
    const update = (current: FeedPost) => ({ ...current, content: "Updated" });
    const feed = { pages: [{ posts: [post()], nextCursor: null } satisfies FeedPage], pageParams: [null] };
    const embedded = post({ id: "repost-1", repostOf: post() });

    expect(patchPostCacheValue(feed, "post-1", update)).toMatchObject({ pages: [{ posts: [{ content: "Updated" }] }] });
    expect(patchPostCacheValue(post(), "post-1", update)).toMatchObject({ content: "Updated" });
    expect(patchPostCacheValue(embedded, "post-1", update)).toMatchObject({ repostOf: { content: "Updated" } });
  });

  it("restores every optimistic cache snapshot after a failed mutation", () => {
    const client = new QueryClient();
    const feedKey = ["feed-posts", "all"];
    const postKey = ["post", "post-1", { teamId: "team-1", hubId: null }];
    client.setQueryData(feedKey, { pages: [{ posts: [post()], nextCursor: null }], pageParams: [null] });
    client.setQueryData(postKey, post());
    const snapshots = snapshotPostCaches(client);

    patchPostCaches(client, "post-1", (current) => ({ ...current, likesCount: 3, hasLiked: true }));
    expect(client.getQueryData<FeedPost>(postKey)).toMatchObject({ likesCount: 3, hasLiked: true });

    restorePostCaches(client, snapshots);
    expect(client.getQueryData<FeedPost>(postKey)).toEqual(post());
    expect(client.getQueryData<{ pages: FeedPage[] }>(feedKey)?.pages[0].posts[0]).toEqual(post());
  });
});
