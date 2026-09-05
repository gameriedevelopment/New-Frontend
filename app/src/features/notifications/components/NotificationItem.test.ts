import { describe, expect, it } from "vitest";
import { notificationTarget } from "./NotificationItem";
import type { GamerieNotification } from "../types";

const notification = (overrides: Partial<GamerieNotification>): GamerieNotification => ({
  id: "notification-1",
  type: "hub-invite",
  message: "Invitation",
  isRead: false,
  createdAt: "2026-09-05T00:00:00.000Z",
  ...overrides,
});

describe("notificationTarget", () => {
  it("routes a hub invitation to its exact membership action", () => {
    expect(
      notificationTarget(
        notification({
          link: "/hubs",
          data: { hubSlug: "arena-hub", requestId: "request-1", actorId: "admin-1" },
        }),
      ),
    ).toBe("/hubs/arena-hub?membershipAction=hub-invite&requestId=request-1&actorId=admin-1");
  });

  it("supports older join-request notifications without a request id", () => {
    expect(
      notificationTarget(
        notification({
          type: "hub-join-request",
          link: "/hubs/arena-hub?tab=admin",
          data: { hubId: "hub-1", actorId: "player-1" },
        }),
      ),
    ).toBe("/hubs/hub-1?membershipAction=hub-join-request&actorId=player-1");
  });
});
