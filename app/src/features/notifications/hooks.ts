import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";
import {
  patchAllNotificationCaches,
  patchNotificationCaches,
  restoreNotificationCaches,
  snapshotNotificationCaches,
} from "./cache";
import type { NotificationFilter } from "./types";

export function useNotifications(
  userId?: string,
  options: {
    enabled?: boolean;
    filter?: NotificationFilter;
    isRead?: boolean;
    limit?: number;
    surface?: string;
  } = {},
) {
  const { enabled = true, filter = "all", isRead, limit = 20, surface = "page" } = options;
  return useInfiniteQuery({
    queryKey: ["notifications", userId, surface, { filter, isRead, limit }],
    queryFn: ({ pageParam }) => getNotifications(userId!, pageParam, limit, isRead, filter),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor || undefined,
    enabled: Boolean(userId) && enabled,
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useMarkNotificationRead(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(userId!, notificationId),
    onMutate: async (notificationId) => {
      await client.cancelQueries({ queryKey: ["notifications", userId] });
      const snapshots = snapshotNotificationCaches(client);
      patchNotificationCaches(client, notificationId, (notification) => ({
        ...notification,
        isRead: true,
      }));
      client.setQueryData<number>(["notifications", userId, "unread-count"], (count) =>
        Math.max(0, (count ?? 1) - 1),
      );
      return { snapshots };
    },
    onError: (_error, _notificationId, context) =>
      restoreNotificationCaches(client, context?.snapshots),
    onSettled: () => client.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useNotificationUnreadCount(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId, "unread-count"],
    queryFn: () => getNotificationUnreadCount(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useMarkAllNotificationsRead(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: ["notifications", userId] });
      const snapshots = snapshotNotificationCaches(client);
      patchAllNotificationCaches(client, (notification) => ({ ...notification, isRead: true }));
      client.setQueryData(["notifications", userId, "unread-count"], 0);
      return { snapshots };
    },
    onError: (_error, _variables, context) => restoreNotificationCaches(client, context?.snapshots),
    onSettled: () => client.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function flattenNotifications(data: ReturnType<typeof useNotifications>["data"]) {
  return data?.pages.flatMap((page) => page.data) ?? [];
}
