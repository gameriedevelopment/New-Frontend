import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { GamerieNotification } from "./types";

type RecordValue = Record<string, unknown>;
export type NotificationCacheSnapshot = Array<[QueryKey, unknown]>;

function record(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function patchNotificationValue(
  value: unknown,
  notificationId: string,
  patcher: (notification: GamerieNotification) => GamerieNotification,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => patchNotificationValue(item, notificationId, patcher));
  if (!record(value)) return value;
  let next = value;
  if (value.id === notificationId)
    next = patcher(value as unknown as GamerieNotification) as unknown as RecordValue;
  for (const key of ["data", "pages"] as const) {
    if (!(key in next)) continue;
    const nested = patchNotificationValue(next[key], notificationId, patcher);
    if (nested !== next[key]) next = { ...next, [key]: nested };
  }
  return next;
}

export function patchAllNotificationValues(
  value: unknown,
  patcher: (notification: GamerieNotification) => GamerieNotification,
): unknown {
  if (Array.isArray(value)) return value.map((item) => patchAllNotificationValues(item, patcher));
  if (!record(value)) return value;
  let next = value;
  if (
    typeof value.id === "string" &&
    typeof value.isRead === "boolean" &&
    typeof value.createdAt === "string"
  ) {
    next = patcher(value as unknown as GamerieNotification) as unknown as RecordValue;
  }
  for (const key of ["data", "pages"] as const) {
    if (!(key in next)) continue;
    const nested = patchAllNotificationValues(next[key], patcher);
    if (nested !== next[key]) next = { ...next, [key]: nested };
  }
  return next;
}

export function snapshotNotificationCaches(client: QueryClient): NotificationCacheSnapshot {
  return client.getQueriesData({ queryKey: ["notifications"] });
}
export function patchNotificationCaches(
  client: QueryClient,
  notificationId: string,
  patcher: (notification: GamerieNotification) => GamerieNotification,
) {
  client.setQueriesData({ queryKey: ["notifications"] }, (value) =>
    patchNotificationValue(value, notificationId, patcher),
  );
}
export function patchAllNotificationCaches(
  client: QueryClient,
  patcher: (notification: GamerieNotification) => GamerieNotification,
) {
  client.setQueriesData({ queryKey: ["notifications"] }, (value) =>
    patchAllNotificationValues(value, patcher),
  );
}
export function restoreNotificationCaches(
  client: QueryClient,
  snapshots?: NotificationCacheSnapshot,
) {
  snapshots?.forEach(([key, value]) => client.setQueryData(key, value));
}
