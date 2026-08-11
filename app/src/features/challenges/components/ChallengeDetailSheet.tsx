import {
  ArrowLeft,
  CalendarDays,
  Coins,
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
  useRefreshChallenge,
  useUpdateChallenge,
} from "../hooks";
import type { Challenge } from "../types";

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
  const remove = useDeleteChallenge();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [schedule, setSchedule] = useState("");
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [onClose]);
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
  const mutateError = update.error || refresh.error || remove.error;
  const respond = async (status: "accepted" | "rejected") => {
    if (!challenge) return;
    await update.mutateAsync({ id, type: challenge.type, updates: { status } });
  };
  const reschedule = async () => {
    if (!challenge || !schedule) return;
    await refresh.mutateAsync({
      id,
      type: challenge.type,
      scheduledDate: new Date(schedule).toISOString(),
    });
    setSchedule("");
  };
  const destroy = async () => {
    if (!challenge) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await remove.mutateAsync({ id, type: challenge.type });
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
              <span>{challenge.status}</span>
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
                <dd>{new Date(challenge.scheduledDate).toLocaleString()}</dd>
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
            {challenge.status === "pending" && incoming ? (
              <div className="challenge-sheet__actions">
                <Button
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => void respond("rejected")}
                >
                  Decline
                </Button>
                <Button disabled={update.isPending} onClick={() => void respond("accepted")}>
                  {update.isPending ? "Updating…" : "Accept challenge"}
                </Button>
              </div>
            ) : null}
            {challenge.status === "expired" && initiated ? (
              <section className="challenge-reschedule">
                <label htmlFor="challenge-reschedule">New date and time</label>
                <div>
                  <input
                    id="challenge-reschedule"
                    type="datetime-local"
                    value={schedule}
                    onChange={(event) => setSchedule(event.target.value)}
                  />
                  <Button
                    disabled={!schedule || refresh.isPending}
                    onClick={() => void reschedule()}
                  >
                    <RefreshCw size={14} />
                    {refresh.isPending ? "Sending…" : "Send again"}
                  </Button>
                </div>
              </section>
            ) : null}
            {initiated &&
            ["pending", "rejected", "completed", "expired"].includes(challenge.status) ? (
              <button
                className="challenge-delete"
                type="button"
                data-confirm={confirmDelete}
                disabled={remove.isPending}
                onClick={() => void destroy()}
              >
                <Trash2 size={14} />
                {remove.isPending
                  ? "Deleting…"
                  : confirmDelete
                    ? "Confirm deletion"
                    : "Delete challenge"}
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
    </div>
  );
}
