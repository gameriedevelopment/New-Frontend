export type NotificationType =
  | "challenge"
  | "challenge-accepted"
  | "match"
  | "team-join-request"
  | "team-join-request-action"
  | "team-invite"
  | "team-invite-action"
  | "team-announcement"
  | "hub-join-request"
  | "hub-join-request-action"
  | "hub-invite"
  | "hub-team-invite"
  | "hub-team-request"
  | "hub-team-request-action"
  | "hub-announcement"
  | "hub-follow"
  | "follow"
  | "achievement"
  | "recommendation"
  | "news"
  | "like"
  | "comment"
  | "endorse"
  | "wallet-purchase"
  | "wallet-transfer"
  | "event-reminder"
  | string;

export type NotificationFilter = "all" | "social" | "teams" | "competitive" | "wallet" | "updates";

export interface GamerieNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  title?: string;
  message: string;
  link?: string | null;
  image?: string | null;
  isRead: boolean;
  createdAt: string;
  data?: NotificationData | null;
}

export interface NotificationData extends Record<string, unknown> {
  actorId?: string;
  actorUsername?: string;
  hubId?: string;
  hubName?: string;
  hubSlug?: string;
  requestId?: string;
  postId?: string;
  challengeId?: string;
}

export interface NotificationsPageData {
  data: GamerieNotification[];
  hasNextPage?: boolean;
  nextCursor?: string | null;
}
