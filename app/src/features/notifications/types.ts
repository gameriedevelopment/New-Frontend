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
  data?: Record<string, unknown> | null;
}

export interface NotificationsPageData {
  data: GamerieNotification[];
  hasNextPage?: boolean;
  nextCursor?: string | null;
}
