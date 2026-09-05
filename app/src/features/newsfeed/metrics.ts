import type { FeedPost } from "./types";

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getPostInteractionCount(post: FeedPost) {
  const likes = numberValue(
    post.likesCount ??
      Object.values(post.reactionCounts ?? {}).reduce((sum, count) => sum + numberValue(count), 0),
  );
  const comments = numberValue(post.totalComments ?? post.commentsCount ?? post.commentCount);
  const reposts = numberValue(post.repostsCount);

  return Math.max(0, likes + comments + reposts);
}

export function getPostReach(post: FeedPost) {
  return Array.isArray(post.analytics?.uniqueViews) ? post.analytics.uniqueViews.length : 0;
}

export function getPostViews(post: FeedPost) {
  return numberValue(post.analytics?.views ?? post.viewCount);
}

export function getPostEngagementRate(post: FeedPost) {
  const interactions = getPostInteractionCount(post);
  if (interactions <= 0) return 0;

  const denominator = Math.max(getPostViews(post), getPostReach(post), 1);
  return Math.min(100, (interactions / denominator) * 100);
}

export function withPostEngagement(post: FeedPost): FeedPost {
  return {
    ...post,
    analytics: {
      ...(post.analytics ?? {}),
      engagementRate: getPostEngagementRate(post),
    },
  };
}
