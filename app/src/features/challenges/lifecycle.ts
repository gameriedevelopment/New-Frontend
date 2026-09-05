import type { Challenge, ChallengeStatus } from "./types";

export type ChallengePhase =
  | "pending"
  | "scheduled"
  | "played"
  | "reschedule_pending"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export function challengePhase(challenge: Challenge, now = Date.now()): ChallengePhase {
  if (challenge.status !== "accepted") return challenge.status as ChallengePhase;
  return new Date(challenge.scheduledDate).getTime() > now ? "scheduled" : "played";
}

const phaseLabels: Record<ChallengePhase, string> = {
  pending: "Awaiting response",
  scheduled: "Scheduled",
  played: "Awaiting score",
  reschedule_pending: "Reschedule proposed",
  completed: "Completed",
  rejected: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function challengePhaseLabel(challenge: Challenge, now = Date.now()): string {
  return phaseLabels[challengePhase(challenge, now)];
}

export function canSubmitScore(challenge: Challenge, now = Date.now()): boolean {
  return challengePhase(challenge, now) === "played";
}

export function canCancel(status: ChallengeStatus): boolean {
  return status === "accepted" || status === "reschedule_pending";
}

export function canPropose(challenge: Challenge, now = Date.now()): boolean {
  return challengePhase(challenge, now) === "scheduled";
}

// Explicit component options — do NOT combine dateStyle/timeStyle with
// timeZoneName; some ICU builds throw "Invalid option" for that mix.
export function formatChallengeDateTime(value: string | Date): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
