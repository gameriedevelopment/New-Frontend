import { AlertCircle, Bell, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Skeleton, SkeletonAvatar, SkeletonText, StatePanel } from "../../components/ui";
import { useAuthStore } from "../auth/authStore";
import { flattenNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useNotificationUnreadCount } from "./hooks";
import { NotificationItem, notificationTarget } from "./components/NotificationItem";
import type { GamerieNotification, NotificationFilter } from "./types";

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "All activity" }, { value: "social", label: "Social" }, { value: "teams", label: "Teams & hubs" },
  { value: "competitive", label: "Matches & challenges" }, { value: "wallet", label: "Wallet" }, { value: "updates", label: "Gamerie updates" },
];

function dayGroup(value: string) {
  const date = new Date(value); const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((start - target) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

function NotificationPageSkeleton() { return <div className="notifications-skeleton" aria-label="Loading notifications" role="status">{Array.from({ length: 6 }, (_, index) => <div key={index}><SkeletonAvatar size={40} /><span><Skeleton width={index % 2 ? "38%" : "28%"} height={9} /><SkeletonText lines={2} /></span></div>)}</div>; }

export function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedFilter = params.get("filter") ?? "all";
  const filter = filters.some((item) => item.value === requestedFilter) ? requestedFilter as NotificationFilter : "all";
  const unreadOnly = params.get("status") === "unread";
  const query = useNotifications(user?.id, { filter, isRead: unreadOnly ? false : undefined, limit: 20, surface: "page" });
  const unreadQuery = useNotificationUnreadCount(user?.id);
  const markRead = useMarkNotificationRead(user?.id);
  const markAllRead = useMarkAllNotificationsRead(user?.id);
  const loadRef = useRef<HTMLDivElement>(null);
  const notifications = flattenNotifications(query.data).filter((notification) => !unreadOnly || !notification.isRead);
  const unread = unreadQuery.data ?? 0;
  const groups = useMemo(() => notifications.reduce<Record<string, GamerieNotification[]>>((result, notification) => { const group = dayGroup(notification.createdAt); (result[group] ||= []).push(notification); return result; }, {}), [notifications]);

  useEffect(() => {
    const node = loadRef.current;
    if (!node || !query.hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage(); }, { rootMargin: "280px" });
    observer.observe(node); return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  const setStatus = (status: "all" | "unread") => { const next = new URLSearchParams(params); if (status === "unread") next.set("status", "unread"); else next.delete("status"); setParams(next, { replace: true }); };
  const setFilter = (value: NotificationFilter) => { const next = new URLSearchParams(params); if (value === "all") next.delete("filter"); else next.set("filter", value); setParams(next, { replace: true }); };
  const open = (notification: GamerieNotification) => { if (!notification.isRead) markRead.mutate(notification.id); navigate(notificationTarget(notification)); };

  return <section className="notifications-page">
    <header><div><p>Activity</p><h1>Notifications</h1><span>Follow the moments that need your attention without losing your place.</span></div>{unread > 0 ? <div className="notifications-page__actions"><strong>{unread > 99 ? "99+" : unread} unread</strong><button type="button" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>{markAllRead.isPending ? "Marking…" : "Mark all read"}</button></div> : null}</header>
    {markAllRead.isError ? <p className="notifications-page__error" role="alert">Your notifications could not all be marked as read. Please try again.</p> : null}
    <div className="notifications-controls"><div role="tablist" aria-label="Read status"><button type="button" role="tab" aria-selected={!unreadOnly} className={!unreadOnly ? "is-active" : undefined} onClick={() => setStatus("all")}>All</button><button type="button" role="tab" aria-selected={unreadOnly} className={unreadOnly ? "is-active" : undefined} onClick={() => setStatus("unread")}>Unread</button></div><label><span>Activity type</span><select value={filter} onChange={(event) => setFilter(event.target.value as NotificationFilter)}>{filters.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div>
    {query.isLoading ? <NotificationPageSkeleton /> : null}
    {query.isError ? <StatePanel tone="error" icon={<AlertCircle size={20} />} title="Notifications could not load" description="Gamerie could not reach your activity right now." action={<Button size="small" variant="quiet" onClick={() => query.refetch()}><RefreshCw size={14} />Try again</Button>} /> : null}
    {!query.isLoading && !query.isError && !notifications.length ? <div className="notifications-empty"><span><Bell size={21} /></span><h2>{unreadOnly ? "Nothing unread" : filter === "all" ? "You’re all caught up" : "No matching activity"}</h2><p>{unreadOnly ? "You have reviewed every notification currently waiting for you." : "New activity will appear here as you connect, play, and build your place on Gamerie."}</p></div> : null}
    {!query.isLoading && !query.isError ? <div className="notifications-groups">{["Today", "Yesterday", "Earlier"].map((name) => groups[name]?.length ? <section key={name}><h2>{name}</h2><div>{groups[name].map((notification) => <NotificationItem key={notification.id} notification={notification} onOpen={open} />)}</div></section> : null)}</div> : null}
    <div className="notifications-load" ref={loadRef}>{query.isFetchingNextPage ? <><SkeletonAvatar size={36} /><SkeletonText lines={2} /></> : query.hasNextPage ? <button type="button" onClick={() => query.fetchNextPage()}>Load more activity</button> : notifications.length ? <span>You’re up to date.</span> : null}</div>
  </section>;
}
