import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { FeedPost } from "./types";

export const postCacheRoots: readonly QueryKey[] = [
  ["feed-posts"],
  ["wall-posts"],
  ["team-posts"],
  ["hub-posts"],
  ["admin-wall-posts"],
  ["post"],
];

type CacheRecord = Record<string, unknown>;
export type PostCacheSnapshot = Array<[QueryKey, unknown]>;

function isRecord(value: unknown): value is CacheRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Patch a post wherever React Query may store it without disturbing its envelope. */
export function patchPostCacheValue(value: unknown, postId: string, patcher: (post: FeedPost) => FeedPost): unknown {
  if (Array.isArray(value)) return value.map((item) => patchPostCacheValue(item, postId, patcher));
  if (!isRecord(value)) return value;

  let next: CacheRecord = value;
  if (value.id === postId) next = patcher(value as unknown as FeedPost) as unknown as CacheRecord;

  const nestedKeys = ["data", "pages", "posts", "items", "repostOf", "originalPost"] as const;
  for (const key of nestedKeys) {
    if (!(key in next)) continue;
    const nested = patchPostCacheValue(next[key], postId, patcher);
    if (nested !== next[key]) next = { ...next, [key]: nested };
  }
  return next;
}

export function snapshotPostCaches(client: QueryClient): PostCacheSnapshot {
  return postCacheRoots.flatMap((queryKey) => client.getQueriesData({ queryKey }));
}

export function patchPostCaches(client: QueryClient, postId: string, patcher: (post: FeedPost) => FeedPost) {
  postCacheRoots.forEach((queryKey) => {
    client.setQueriesData({ queryKey }, (current) => patchPostCacheValue(current, postId, patcher));
  });
}

export function restorePostCaches(client: QueryClient, snapshots?: PostCacheSnapshot) {
  snapshots?.forEach(([queryKey, data]) => client.setQueryData(queryKey, data));
}
