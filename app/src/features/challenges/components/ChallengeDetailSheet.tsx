import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CalendarClock,
  Coins,
  Flag,
  RefreshCw,
  Swords,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Skeleton, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import {
  useChallenge,
  useDeleteChallenge,
  useProposeReschedule,
  useRefreshChallenge,
  useRespondReschedule,
  useUpdateChallenge,
} from "../hooks";
import {
  canCancel,
  canDelete,
  canPropose,
  canSubmitScore,
  challengePhaseLabel,
  formatChallengeDateTime,
} from "../lifecycle";
import type { Challenge } from "../types";
import { ChallengeConfirmDialog } from "./ChallengeConfirmDialog";
import { ChallengeReportDialog } from "./ChallengeReportDialog";
import { ChallengeRescheduleDialog } from "./ChallengeRescheduleDialog";
import { ChallengeScoreDialog } from "./ChallengeScoreDialog";

function participantNames(challenge: Challenge) {
  return challenge.type === "team"
    ? [challenge.challengerTeamName, challenge.challengedTeamName]
    : [challenge.challengerName, challenge.challengedName];
}

export function ChallengeDetailSheet({
  id,
  currentUserId,
  ownedTeamIds,
  onClose,
}: {
  id: string;
  currentUserId?: string;
  ownedTeamIds: string[];
  onClose: () => void;
}) {
  const query = useChallenge(id);
  const update = useUpdateChallenge();
  const refresh = useRefreshChallenge();
  const propose = useProposeReschedule();
  const respond = useRespondReschedule();
  const remove = useDeleteChallenge();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [confirming, setConfirming] = useState<"cancel" | "delete" | null>(null);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      previousFocus?.focus();
    };
  }, []);
  const challenge = query.data;
  const incoming = challenge
    ? challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengedTeamId || "")
      : challenge.challengedId === currentUserId
    : false;
  const initiated = challenge
    ? challenge.type === "team"
      ? ownedTeamIds.includes(challenge.challengerTeamId || "")
      : challenge.initiatedBy === currentUserId || challenge.challengerId === currentUserId
    : false;
  const mutateError =
    update.error || refresh.error || propose.error || respond.error || remove.error;
  const isParticipant = incoming || initiated;
  const proposedByMe = challenge?.reschedule?.proposedBy === currentUserId;
  const respondInvite = async (status: "accepted" | "rejected") => {
    if (!challenge) return;
    await update.mutateAsync({ id, type: challenge.type, updates: { status } });
  };
  const submitReschedule = async (scheduledDate: string) => {
    if (!challenge) return;
    if (challenge.status === "expired") {
      await refresh.mutateAsync({ id, type: challenge.type, scheduledDate });
    } else {
      await propose.mutateAsync({ id, type: challenge.type, scheduledDate });
    }
    setRescheduleOpen(false);
  };
  const answerReschedule = async (accept: boolean) => {
    if (!challenge) return;
    await respond.mutateAsync({ id, type: challenge.type, accept });
  };
  const cancel = async () => {
    if (!challenge) return;
    await update.mutateAsync({ id, type: challenge.type, updates: { status: "cancelled" } });
    setConfirming(null);
  };
  const destroy = async () => {
    if (!challenge) return;
    await remove.mutateAsync({ id, type: challenge.type });
    setConfirming(null);
    onClose();
  };
  return (
    <div
      className="challenge-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-sheet-title"
    >
      <button
        className="challenge-sheet__scrim"
        type="button"
        onClick={onClose}
        aria-label="Close challenge details"
      />
      <aside ref={panelRef}>
        <header>
          <button className="challenge-sheet__mobile-back" type="button" onClick={onClose}>
            <ArrowLeft size={17} />
            Back
          </button>
          <div>
            <h2 id="challenge-sheet-title">Challenge details</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {query.isLoading ? (
          <div className="challenge-sheet__loading">
            <Skeleton height={128} />
            <Skeleton height={220} />
            <Skeleton height={90} />
          </div>
        ) : query.isError || !challenge ? (
          <StatePanel
            tone="error"
            title="Challenge unavailable"
            description={getApiErrorMessage(query.error, "This challenge could not be retrieved.")}
            action={
              <Button variant="secondary" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <div className="challenge-sheet__content">
            <section className="challenge-versus">
              <span>{challengePhaseLabel(challenge)}</span>
              <div>
                <strong>{participantNames(challenge)[0] || "Challenger"}</strong>
                <i>versus</i>
                <strong>{participantNames(challenge)[1] || "Opponent"}</strong>
              </div>
            </section>
            <dl className="challenge-detail-grid">
              <div>
                <dt>
                  <Swords size={14} />
                  Game
                </dt>
                <dd>{challenge.game}</dd>
              </div>
              <div>
                <dt>
                  <Trophy size={14} />
                  Format
                </dt>
                <dd>{challenge.format}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={14} />
                  Schedule
                </dt>
                <dd>{formatChallengeDateTime(challenge.scheduledDate)}</dd>
              </div>
              {challenge.teamSize ? (
                <div>
                  <dt>
                    <Users size={14} />
                    Team size
                  </dt>
                  <dd>
                    {challenge.teamSize}v{challenge.teamSize}
                  </dd>
                </div>
              ) : null}
              {Number(challenge.tokenAmount) > 0 ? (
                <div>
                  <dt>
                    <Coins size={14} />
                    Reserved stake
                  </dt>
                  <dd>{Number(challenge.tokenAmount).toLocaleString()} GLK per side</dd>
                </div>
              ) : null}
            </dl>
            {challenge.message ? (
              <section className="challenge-note">
                <p>Challenge note</p>
                <blockquote>{challenge.message}</blockquote>
              </section>
            ) : null}
            {challenge.stakes ? (
              <section className="challenge-note">
                <p>Additional stakes</p>
                <blockquote>{challenge.stakes}</blockquote>
              </section>
            ) : null}
            {challenge.result ? (
              <section className="challenge-result">
                <Trophy size={18} />
                <div>
                  <p>Recorded result</p>
                  <strong>{challenge.result.score}</strong>
                  <span>
                    {challenge.result.notes ||
                      "Final result verified through the challenge lifecycle."}
                  </span>
                </div>
              </section>
            ) : null}
            {challenge.status === "completed" && isParticipant ? (
              <button
                className="challenge-report"
                type="button"
                disabled={reported}
                onClick={() => setReportOpen(true)}
              >
                <Flag size={14} />
                {reported ? "Result reported" : "Report result"}
              </button>
            ) : null}
            {challenge.status === "pending" && incoming ? (
              <div className="challenge-sheet__actions">
                <Button
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => void respondInvite("rejected")}
                >
                  Decline
                </Button>
                <Button disabled={update.isPending} onClick={() => void respondInvite("accepted")}>
                  {update.isPending ? "Updating…" : "Accept challenge"}
                </Button>
              </div>
            ) : null}
            {canSubmitScore(challenge) && isParticipant ? (
              <div className="challenge-sheet__actions">
                <Button onClick={() => setScoreOpen(true)}>
                  <Trophy size={14} />
                  Submit result
                </Button>
              </div>
            ) : null}
            {challenge.status === "reschedule_pending" && isParticipant ? (
              <section className="challenge-reschedule-banner">
                <CalendarClock size={16} />
                <div>
                  <p>
                    {proposedByMe ? "You proposed a new time" : "New time proposed"}
                    <strong>
                      {" "}
                      {formatChallengeDateTime(
                        challenge.reschedule?.proposedDate ?? challenge.scheduledDate,
                      )}
                    </strong>
                  </p>
                  {proposedByMe ? (
                    <span>Waiting for the other player to respond.</span>
                  ) : (
                    <div className="challenge-sheet__actions">
                      <Button
                        variant="secondary"
                        disabled={respond.isPending}
                        onClick={() => void answerReschedule(false)}
                      >
                        Decline
                      </Button>
                      <Button
                        disabled={respond.isPending}
                        onClick={() => void answerReschedule(true)}
                      >
                        {respond.isPending ? "Updating…" : "Accept new time"}
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            ) : null}
            {(canPropose(challenge) || challenge.status === "expired") && isParticipant ? (
              <div className="challenge-sheet__actions">
                <Button variant="secondary" onClick={() => setRescheduleOpen(true)}>
                  {challenge.status === "expired" ? (
                    <RefreshCw size={14} />
                  ) : (
                    <CalendarClock size={14} />
                  )}
                  {challenge.status === "expired" ? "Reschedule" : "Propose new time"}
                </Button>
              </div>
            ) : null}
            {canCancel(challenge.status) && isParticipant ? (
              <button
                className="challenge-cancel"
                type="button"
                disabled={update.isPending}
                onClick={() => setConfirming("cancel")}
              >
                <Ban size={14} />
                Cancel challenge
              </button>
            ) : null}
            {initiated && canDelete(challenge.status) ? (
              <button
                className="challenge-delete"
                type="button"
                disabled={remove.isPending}
                onClick={() => setConfirming("delete")}
              >
                <Trash2 size={14} />
                Delete challenge
              </button>
            ) : null}
            {mutateError ? (
              <p className="challenge-error" role="alert">
                {getApiErrorMessage(mutateError, "The challenge could not be updated.")}
              </p>
            ) : null}
          </div>
        )}
      </aside>
      {scoreOpen && challenge ? (
        <ChallengeScoreDialog challenge={challenge} onClose={() => setScoreOpen(false)} />
      ) : null}
      {reportOpen && challenge ? (
        <ChallengeReportDialog
          challenge={challenge}
          onReported={() => {
            setReported(true);
            setReportOpen(false);
          }}
          onClose={() => setReportOpen(false)}
        />
      ) : null}
      {rescheduleOpen && challenge ? (
        <ChallengeRescheduleDialog
          mode={challenge.status === "expired" ? "refresh" : "propose"}
          pending={refresh.isPending || propose.isPending}
          error={
            refresh.error || propose.error
              ? getApiErrorMessage(refresh.error || propose.error, "Could not reschedule.")
              : undefined
          }
          onSubmit={(iso) => void submitReschedule(iso)}
          onClose={() => setRescheduleOpen(false)}
        />
      ) : null}
      {confirming === "cancel" ? (
        <ChallengeConfirmDialog
          title="Cancel this challenge?"
          description="Both players will be notified and any reserved GLK stake is released. This cannot be undone."
          confirmLabel="Cancel challenge"
          confirmingLabel="Cancelling…"
          pending={update.isPending}
          onConfirm={() => void cancel()}
          onClose={() => setConfirming(null)}
        />
      ) : null}
      {confirming === "delete" ? (
        <ChallengeConfirmDialog
          title="Delete this challenge?"
          description="The challenge and its record will be permanently removed. This cannot be undone."
          confirmLabel="Delete challenge"
          confirmingLabel="Deleting…"
          pending={remove.isPending}
          onConfirm={() => void destroy()}
          onClose={() => setConfirming(null)}
        />
      ) : null}
    </div>
  );
}
