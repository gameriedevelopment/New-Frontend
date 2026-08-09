import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { patchAllNotificationCaches, patchNotificationCaches, restoreNotificationCaches, snapshotNotificationCaches } from "./cache";
import type { GamerieNotification } from "./types";

const notification: GamerieNotification = { id: "n1", type: "like", message: "Nova liked your post", isRead: false, createdAt: "2026-08-09T20:00:00Z" };

describe("notification cache reconciliation", () => {
  it("patches bell, unread, and filtered notification queries together", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "u1", "menu"], { pages: [{ data: [notification] }], pageParams: [null] });
    client.setQueryData(["notifications", "u1", "unread"], { pages: [{ data: [notification] }], pageParams: [null] });
    patchNotificationCaches(client, "n1", (current) => ({ ...current, isRead: true }));
    expect(client.getQueryData<{ pages: Array<{ data: GamerieNotification[] }> }>(["notifications", "u1", "menu"])?.pages[0].data[0].isRead).toBe(true);
    expect(client.getQueryData<{ pages: Array<{ data: GamerieNotification[] }> }>(["notifications", "u1", "unread"])?.pages[0].data[0].isRead).toBe(true);
  });

  it("restores all notification surfaces after a failed read mutation", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "u1", "all"], { data: [notification] });
    const snapshots = snapshotNotificationCaches(client);
    patchNotificationCaches(client, "n1", (current) => ({ ...current, isRead: true }));
    restoreNotificationCaches(client, snapshots);
    expect(client.getQueryData<{ data: GamerieNotification[] }>(["notifications", "u1", "all"])?.data[0].isRead).toBe(false);
  });

  it("marks every cached notification as read without changing page metadata", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "u1", "page"], { pages: [{ data: [notification, { ...notification, id: "n2" }], hasNextPage: true }], pageParams: [null] });
    patchAllNotificationCaches(client, (current) => ({ ...current, isRead: true }));
    const page = client.getQueryData<{ pages: Array<{ data: GamerieNotification[]; hasNextPage: boolean }> }>(["notifications", "u1", "page"])?.pages[0];
    expect(page?.data.every((item) => item.isRead)).toBe(true);
    expect(page?.hasNextPage).toBe(true);
  });
});
