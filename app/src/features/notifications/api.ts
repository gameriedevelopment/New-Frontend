import { api } from "../../lib/api";
import type { NotificationFilter, NotificationsPageData } from "./types";

interface ApiEnvelope<T> {
  data: T;
}

export async function getNotifications(
  userId: string,
  cursor: string | null,
  limit: number,
  isRead?: boolean,
  filter: NotificationFilter = "all",
): Promise<NotificationsPageData> {
  const { data } = await api.get<NotificationsPageData>(`/notifications/${userId}`, {
    params: {
      limit,
      after: cursor || undefined,
      isRead,
      filter: filter === "all" ? undefined : filter,
    },
  });
  return data;
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await api.patch(`/notifications/${userId}/read/${notificationId}`);
}

export async function getNotificationUnreadCount(userId: string): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>(`/notifications/${userId}/unread-count`);
  return data.data;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const { data } = await api.patch<ApiEnvelope<{ updated: number }>>(
    `/notifications/${userId}/read-all`,
  );
  return data.data.updated;
}
