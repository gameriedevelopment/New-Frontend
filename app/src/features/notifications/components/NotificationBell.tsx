import { Bell, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { flattenNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useNotificationUnreadCount } from "../hooks";
import type { GamerieNotification } from "../types";
import { NotificationItem, notificationTarget } from "./NotificationItem";

export function NotificationBell() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyboardOpenRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const panelId = useId();
  const menuQuery = useNotifications(user?.id, { enabled: open, limit: 6, surface: "menu" });
  const unreadQuery = useNotificationUnreadCount(user?.id);
  const markRead = useMarkNotificationRead(user?.id);
  const markAllRead = useMarkAllNotificationsRead(user?.id);
  const menu = flattenNotifications(menuQuery.data).slice(0, 6);
  const unread = unreadQuery.data ?? 0;
  const badge = unread > 99 ? "99+" : String(unread);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && rootRef.current?.contains(event.target as Node)) return;
      restoreFocusRef.current = event instanceof KeyboardEvent;
      setOpen(false);
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    if (keyboardOpenRef.current) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>(".notification-item")?.focus());
    return () => {
      document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close);
      if (restoreFocusRef.current) triggerRef.current?.focus();
      restoreFocusRef.current = false;
    };
  }, [open]);

  const openNotification = (notification: GamerieNotification) => {
    restoreFocusRef.current = false;
    setOpen(false);
    if (!notification.isRead) markRead.mutate(notification.id);
    navigate(notificationTarget(notification));
  };

  const activate = (fromKeyboard: boolean) => {
    if (window.matchMedia("(max-width: 760px)").matches) navigate("/notifications");
    else {
      keyboardOpenRef.current = fromKeyboard;
      restoreFocusRef.current = false;
      setOpen((current) => !current);
    }
  };

  return <div className="notification-bell" ref={rootRef}>
    <button ref={triggerRef} className="app-header__icon" type="button" onClick={(event) => activate(event.detail === 0)} aria-label={unread ? `Notifications, ${badge} unread` : "Notifications"} aria-expanded={open} aria-controls={open ? panelId : undefined}><Bell size={18} />{unread ? <span className="app-header__badge">{badge}</span> : null}</button>
    {open ? <div className="notification-menu" ref={panelRef} id={panelId} role="dialog" aria-label="Recent notifications">
      <header><div><p>Activity</p><h2>Notifications</h2></div>{unread ? <button type="button" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>{markAllRead.isPending ? "Marking…" : "Mark all read"}</button> : null}</header>
      {markAllRead.isError ? <p className="notification-menu__error">Could not mark notifications as read. Please try again.</p> : null}
      <div className="notification-menu__list">
        {menuQuery.isLoading ? Array.from({ length: 4 }, (_, index) => <div className="notification-item-skeleton" key={index}><SkeletonAvatar size={36} /><SkeletonText lines={2} /><Skeleton width={24} height={7} /></div>) : null}
        {menuQuery.isError ? <div className="notification-menu__state"><strong>Notifications could not load</strong><button type="button" onClick={() => menuQuery.refetch()}>Try again</button></div> : null}
        {!menuQuery.isLoading && !menuQuery.isError && !menu.length ? <div className="notification-menu__state"><Bell size={18} /><strong>You’re all caught up</strong><p>New activity will appear here.</p></div> : null}
        {menu.map((notification) => <NotificationItem compact key={notification.id} notification={notification} onOpen={openNotification} />)}
      </div>
      <Link to="/notifications" onClick={() => { restoreFocusRef.current = false; setOpen(false); }}>View all notifications<ChevronRight size={15} /></Link>
    </div> : null}
  </div>;
}
