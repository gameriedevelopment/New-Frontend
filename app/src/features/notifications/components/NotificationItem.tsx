import { Award, Bell, Heart, MessageCircle, ShieldCheck, Swords, UserPlus, Users, WalletCards } from "lucide-react";
import { SafeImage } from "../../../components/ui";
import type { GamerieNotification } from "../types";

export function notificationTarget(notification: GamerieNotification) {
  if (notification.link?.startsWith("/")) return notification.link;
  const data = notification.data ?? {};
  if (typeof data.postId === "string") return `/post/${data.postId}`;
  if (typeof data.actorUsername === "string") return `/profile/${data.actorUsername}`;
  return "/notifications";
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "like") return <Heart size={17} />;
  if (type === "comment") return <MessageCircle size={17} />;
  if (type === "follow" || type === "endorse") return <UserPlus size={17} />;
  if (type.includes("team") || type.includes("hub")) return <Users size={17} />;
  if (type.includes("challenge") || type === "match") return <Swords size={17} />;
  if (type === "achievement") return <Award size={17} />;
  if (type.includes("wallet")) return <WalletCards size={17} />;
  if (type === "recommendation") return <ShieldCheck size={17} />;
  return <Bell size={17} />;
}

function relativeTime(value: string) {
  const milliseconds = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10_080) return `${Math.floor(minutes / 1440)}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

export function NotificationItem({ compact = false, notification, onOpen }: { compact?: boolean; notification: GamerieNotification; onOpen: (notification: GamerieNotification) => void }) {
  return <button className="notification-item" data-compact={compact || undefined} data-unread={!notification.isRead || undefined} type="button" onClick={() => onOpen(notification)}>
    <span className="notification-item__visual">{notification.image ? <SafeImage src={notification.image} alt="" /> : <NotificationIcon type={notification.type} />}</span>
    <span className="notification-item__body"><strong>{notification.title || "Gamerie update"}</strong><span>{notification.message}</span><time dateTime={notification.createdAt}>{relativeTime(notification.createdAt)}</time></span>
    {!notification.isRead ? <><i aria-hidden="true" /><span className="sr-only">Unread</span></> : null}
  </button>;
}
