import { CalendarDays, Coins } from "lucide-react";
import { challengePhase, challengePhaseLabel } from "../lifecycle";
import type { Challenge } from "../types";

const names = (challenge: Challenge) =>
  challenge.type === "team"
    ? [
        challenge.challengerTeamName || "Challenging team",
        challenge.challengedTeamName || "Challenged team",
      ]
    : [challenge.challengerName || "Challenger", challenge.challengedName || "Challenged player"];

export function ChallengeCard({
  challenge,
  currentUserId,
  ownedTeamIds,
  onOpen,
  onRespond,
  pending,
}: {
  challenge: Challenge;
  currentUserId?: string;
  ownedTeamIds: string[];
  onOpen: () => void;
  onRespond: (status: "accepted" | "rejected") => void;
  pending: boolean;
}) {
  const [challenger, challenged] = names(challenge);
  const incoming =
    challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengedTeamId || "")
      : challenge.challengedId === currentUserId;
  const initiated =
    challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengerTeamId || "")
      : challenge.initiatedBy === currentUserId || challenge.challengerId === currentUserId;
  const isParticipant = incoming || initiated;
  const scheduled = new Date(challenge.scheduledDate);
  const phase = challengePhase(challenge);
  const phaseLabel = challengePhaseLabel(challenge);
  const nextHint =
    phase === "pending" && incoming
      ? "Your response"
      : phase === "played" && isParticipant
        ? "Submit your score"
        : phase === "reschedule_pending" && isParticipant
          ? "Reschedule proposed"
          : null;
  return (
    <article className="challenge-card" data-status={phase}>
      <button
        className="challenge-card__body"
        type="button"
        onClick={onOpen}
        aria-label={`Open ${challenger} versus ${challenged} challenge`}
      >
        <div className="challenge-card__identity">
          <span className="challenge-card__status">{phaseLabel}</span>
          <div className="challenge-card__matchup">
            <span>{challenger}</span>
            <i>vs</i>
            <span>{challenged}</span>
          </div>
        </div>
        <div className="challenge-card__context">
          <strong>{challenge.game}</strong>
          <span>
            {challenge.format}
            {challenge.teamSize ? ` · ${challenge.teamSize}v${challenge.teamSize}` : ""}
          </span>
        </div>
        <div className="challenge-card__meta">
          <span>
            <CalendarDays size={14} />
            <time dateTime={challenge.scheduledDate}>
              {scheduled.toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </time>
          </span>
          {Number(challenge.tokenAmount) > 0 ? (
            <span>
              <Coins size={14} />
              {Number(challenge.tokenAmount).toLocaleString()} GLK each
            </span>
          ) : null}
        </div>
      </button>
      {challenge.status === "pending" && incoming ? (
        <footer>
          <button type="button" disabled={pending} onClick={() => onRespond("rejected")}>
            Decline
          </button>
          <button type="button" disabled={pending} onClick={() => onRespond("accepted")}>
            {pending ? "Updating…" : "Accept challenge"}
          </button>
        </footer>
      ) : (
        <footer className="challenge-card__next" data-hint={nextHint ? "true" : "false"}>
          {nextHint ? <span>{nextHint}</span> : null}
          <button type="button" onClick={onOpen}>
            View details
          </button>
        </footer>
      )}
    </article>
  );
}
