export type FeedFilter = "all" | "following" | "teams";
export type PostOwnerType = "user" | "team" | "hub";

export interface FeedAuthor {
  id?: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  profilePictureUrl?: string | null;
  isOnline?: boolean;
}

export interface FeedPost {
  id: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  author?: FeedAuthor;
  user?: FeedAuthor;
  userId?: string;
  teamId?: string;
  hubId?: string;
  isAnnouncement?: boolean;
  media?: string[];
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | string | null;
  tags?: string[];
  likesCount?: number;
  reactionCounts?: Record<string, number>;
  hasLiked?: boolean;
  userReaction?: string | null;
  commentsCount?: number;
  commentCount?: number;
  totalComments?: number;
  repostsCount?: number;
  hasReposted?: boolean;
  viewCount?: number;
  analytics?: {
    views?: number;
    uniqueViews?: string[];
    engagementRate?: number;
    avgTimeSpent?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  repostOf?: FeedPost;
  originalPost?: FeedPost;
  [key: string]: unknown;
}

export interface FeedComment {
  id: string;
  content: string;
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  author?: FeedAuthor;
  user?: FeedAuthor;
  userId?: string;
  parentId?: string | null;
  likes?: Array<string | FeedAuthor>;
  likesCount?: number;
  replies?: FeedComment[];
  replyCount?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export interface TrendingTopic {
  id?: string;
  tag?: string;
  topic?: string;
  count?: number;
  postCount?: number;
  commentCount?: number;
}

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

export interface CreatePostPayload {
  content: string;
  media?: File[];
  tags?: string[];
  isAnnouncement?: boolean;
}

export interface HubPostContext {
  id?: string;
  ownerId?: string;
  name?: string;
  members?: Array<{ userId?: string; role?: string; status?: string; user?: { id?: string } }>;
}

export interface TeamPostContext {
  id?: string;
  ownerId?: string;
  name?: string;
  members?: Array<{ userId?: string; role?: string; status?: string; user?: { id?: string } }>;
}
