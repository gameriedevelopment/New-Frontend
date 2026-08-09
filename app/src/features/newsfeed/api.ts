import { api } from "../../lib/api";
import type { CreatePostPayload, FeedComment, FeedFilter, FeedPage, FeedPost, HubPostContext, LinkPreview, PostOwnerType, TrendingTopic } from "./types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function postArray(value: unknown): FeedPost[] {
  return Array.isArray(value) ? (value as FeedPost[]) : [];
}

export function normalizeFeedPage(payload: unknown): FeedPage {
  const root = record(payload);
  const nested = record(root?.data);
  const source = nested ?? root;
  const posts = postArray(source?.posts ?? source?.items ?? (Array.isArray(payload) ? payload : []));
  const cursor = source?.nextCursor;
  return { posts, nextCursor: typeof cursor === "string" && cursor ? cursor : null };
}

export async function getFeedPosts(filter: FeedFilter, cursor?: string | null): Promise<FeedPage> {
  const { data } = await api.get("/newsfeed", {
    params: { limit: 10, filter, cursor: cursor || undefined },
  });
  return normalizeFeedPage(data);
}

export async function getSinglePost(postId: string, teamId?: string, hubId?: string): Promise<FeedPost> {
  const { data } = await api.get(`/newsfeed/${postId}`, { params: { teamId, hubId } });
  return (record(data)?.data ?? data) as FeedPost;
}

export async function getHubPostContext(hubId: string): Promise<HubPostContext> {
  const { data } = await api.get(`/hubs/${hubId}`);
  return (record(data)?.data ?? data) as HubPostContext;
}

export async function getPostComments(postId: string, type: PostOwnerType): Promise<FeedComment[]> {
  const { data } = await api.get(`/newsfeed/${postId}/comments/${type}`);
  const payload = record(data)?.data ?? data;
  return Array.isArray(payload) ? payload as FeedComment[] : [];
}

export async function addComment(postId: string, content: string, parentCommentId: string | null, type: PostOwnerType) {
  await api.post(`/newsfeed/${postId}/comment/${type}`, { content, parentCommentId });
}

export async function toggleCommentLike(commentId: string): Promise<FeedComment> {
  const { data } = await api.post(`/newsfeed/${commentId}/comment/like/toggle`);
  return (record(data)?.data ?? data) as FeedComment;
}

export async function editComment(commentId: string, content: string): Promise<FeedComment> {
  const { data } = await api.patch(`/newsfeed/comment/${commentId}/update`, { content });
  return (record(data)?.data ?? data) as FeedComment;
}

export async function deleteComment(commentId: string) {
  await api.delete(`/newsfeed/comment/${commentId}/delete`);
}

export async function notifyPostComment(payload: { userId: string; targetId: string; contentType: "post"; contentId: string }) {
  await api.post("/notifications/comment", payload);
}

export async function notifyPostLike(payload: { userId: string; targetId: string; contentType: "post"; contentId: string }) {
  await api.post("/notifications/like", payload);
}

export async function createPost(userId: string, payload: CreatePostPayload): Promise<FeedPost> {
  const formData = new FormData();
  formData.append("content", payload.content);
  if (payload.tags?.length) formData.append("tags", JSON.stringify(payload.tags));
  payload.media?.forEach((file) => formData.append("media", file));
  const { data } = await api.post(`/newsfeed/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (record(data)?.data ?? data) as FeedPost;
}

export async function togglePostLike(postId: string, type: PostOwnerType): Promise<FeedPost> {
  const { data } = await api.post(`/newsfeed/${postId}/like/${type}`);
  return (record(data)?.data ?? data) as FeedPost;
}

export async function editPost(postId: string, content: string, type: PostOwnerType): Promise<FeedPost> {
  const { data } = await api.patch(`/newsfeed/${postId}/${type}`, { content });
  return (record(data)?.data ?? data) as FeedPost;
}

export async function deletePost(postId: string, type: PostOwnerType) {
  await api.delete(`/newsfeed/${postId}/${type}`);
}

export async function toggleRepost(postId: string, comment: string): Promise<{ reposted: boolean }> {
  const { data } = await api.post(`/newsfeed/${postId}/repost`, { comment });
  return (record(data)?.data ?? data) as { reposted: boolean };
}

export interface ReportPayload {
  contentId: string;
  contentType: "post" | "comment";
  contentAuthorId: string;
  reporterId: string;
  type: "spam" | "harassment" | "inappropriate" | "other";
  reason: string;
}

export async function createReport(payload: ReportPayload) {
  const { data } = await api.post("/reports", payload);
  return data;
}

export async function trackPostView(postId: string) {
  await api.post(`/newsfeed/${postId}/view`);
}

export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  const { data } = await api.get("/newsfeed/trending/topics");
  const root = record(data);
  const nested = record(root?.data);
  const topics = nested?.topics ?? root?.topics ?? root?.data ?? data;
  return Array.isArray(topics) ? (topics as TrendingTopic[]) : [];
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  const { data } = await api.get("/newsfeed/link-preview", { params: { url } });
  return (record(data)?.data ?? data) as LinkPreview;
}
