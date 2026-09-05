import { describe, expect, it } from "vitest";
import {
  canCancel,
  canPropose,
  canSubmitScore,
  challengePhase,
  challengePhaseLabel,
} from "./lifecycle";
import type { Challenge } from "./types";

const base = (overrides: Partial<Challenge>): Challenge =>
  ({
    id: "c1",
    type: "user",
    game: "Valorant",
    format: "Best of 3",
    scheduledDate: new Date().toISOString(),
    status: "pending",
    ...overrides,
  }) as Challenge;

const future = new Date(Date.now() + 3_600_000).toISOString();
const past = new Date(Date.now() - 3_600_000).toISOString();

describe("challengePhase", () => {
  it("derives scheduled vs played from accepted + time", () => {
    expect(challengePhase(base({ status: "accepted", scheduledDate: future }))).toBe("scheduled");
    expect(challengePhase(base({ status: "accepted", scheduledDate: past }))).toBe("played");
  });

  it("passes non-accepted statuses through", () => {
    expect(challengePhase(base({ status: "cancelled" }))).toBe("cancelled");
    expect(challengePhase(base({ status: "completed" }))).toBe("completed");
    expect(challengePhase(base({ status: "reschedule_pending" }))).toBe("reschedule_pending");
  });
});

describe("labels and capabilities", () => {
  it("labels the derived phases", () => {
    expect(challengePhaseLabel(base({ status: "accepted", scheduledDate: future }))).toBe(
      "Scheduled",
    );
    expect(challengePhaseLabel(base({ status: "accepted", scheduledDate: past }))).toBe(
      "Awaiting score",
    );
    expect(challengePhaseLabel(base({ status: "cancelled" }))).toBe("Cancelled");
  });

  it("only allows scoring once the match time has passed", () => {
    expect(canSubmitScore(base({ status: "accepted", scheduledDate: future }))).toBe(false);
    expect(canSubmitScore(base({ status: "accepted", scheduledDate: past }))).toBe(true);
    expect(canSubmitScore(base({ status: "pending", scheduledDate: past }))).toBe(false);
  });

  it("gates cancel and propose to the right statuses", () => {
    expect(canCancel("accepted")).toBe(true);
    expect(canCancel("reschedule_pending")).toBe(true);
    expect(canCancel("completed")).toBe(false);
    expect(canPropose(base({ status: "accepted", scheduledDate: future }))).toBe(true);
    expect(canPropose(base({ status: "accepted", scheduledDate: past }))).toBe(false);
    expect(canPropose(base({ status: "reschedule_pending" }))).toBe(false);
  });
});
