import { Trophy, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUpdateChallenge } from "../hooks";
import type { Challenge } from "../types";

function sides(challenge: Challenge) {
  return challenge.type === "team"
    ? {
        firstId: challenge.challengerTeamId || "",
        firstName: challenge.challengerTeamName || "Your team",
        secondId: challenge.challengedTeamId || "",
        secondName: challenge.challengedTeamName || "Opponent",
      }
    : {
        firstId: challenge.challengerId || "",
        firstName: challenge.challengerName || "Challenger",
        secondId: challenge.challengedId || "",
        secondName: challenge.challengedName || "Opponent",
      };
}

export function ChallengeScoreDialog({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const update = useUpdateChallenge();
  const panelRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const { firstId, firstName, secondId, secondName } = useMemo(() => sides(challenge), [challenge]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => firstInputRef.current?.focus());
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !update.isPending) onCloseRef.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outcome =
    p1 !== "" && p2 !== ""
      ? Number(p1) === Number(p2)
        ? "Draw"
        : Number(p1) > Number(p2)
          ? `${firstName} wins`
          : `${secondName} wins`
      : "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const s1 = Number(p1);
    const s2 = Number(p2);
    if (p1 === "" || p2 === "" || Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("Enter both scores as non-negative numbers.");
      return;
    }
    try {
      await update.mutateAsync({
        id: challenge.id,
        type: challenge.type,
        updates: {
          status: "completed",
          result: {
            p1Score: s1,
            p2Score: s2,
            winnerId: s1 === s2 ? "draw" : s1 > s2 ? firstId : secondId,
            score: `${s1}-${s2}`,
            notes: notes.trim() || undefined,
          },
        },
      });
      onClose();
    } catch {
      /* surfaced below */
    }
  };

  return createPortal(
    <div
      className="challenge-score-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-score-title"
    >
      <button
        className="challenge-score-dialog__scrim"
        type="button"
        aria-label="Close score entry"
        onClick={() => !update.isPending && onClose()}
      />
      <section ref={panelRef}>
        <header>
          <div>
            <Trophy size={18} />
            <h2 id="challenge-score-title">Submit match result</h2>
          </div>
          <button type="button" onClick={onClose} disabled={update.isPending} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={(event) => void submit(event)}>
          <div className="challenge-score-grid">
            <label>
              <span>{firstName}</span>
              <input
                ref={firstInputRef}
                type="number"
                min="0"
                inputMode="numeric"
                value={p1}
                onChange={(event) => setP1(event.target.value)}
              />
            </label>
            <label>
              <span>{secondName}</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={p2}
                onChange={(event) => setP2(event.target.value)}
              />
            </label>
          </div>
          {outcome ? <p className="challenge-score-outcome">Result: {outcome}</p> : null}
          <label className="challenge-score-notes">
            <span>
              Notes <em>Optional</em>
            </span>
            <textarea
              maxLength={300}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth noting about the match."
            />
          </label>
          {error ? (
            <p className="challenge-error" role="alert">
              {error}
            </p>
          ) : null}
          {update.isError ? (
            <p className="challenge-error" role="alert">
              {getApiErrorMessage(update.error, "The result could not be submitted.")}
            </p>
          ) : null}
          <footer>
            <Button variant="quiet" type="button" disabled={update.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Submitting…" : "Submit result"}
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
