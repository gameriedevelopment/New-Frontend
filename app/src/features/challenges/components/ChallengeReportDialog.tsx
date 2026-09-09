import { Flag, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useReportChallengeScore } from "../hooks";
import type { Challenge } from "../types";

type ReportType = "spam" | "harassment" | "inappropriate" | "other";

const reasonOptions: Array<{ value: ReportType; label: string }> = [
  { value: "other", label: "The result is fake or incorrect" },
  { value: "inappropriate", label: "The winner is wrong" },
  { value: "spam", label: "The score was not agreed" },
  { value: "harassment", label: "Other issue" },
];

export function ChallengeReportDialog({
  challenge,
  onClose,
  onReported,
}: {
  challenge: Challenge;
  onClose: () => void;
  onReported: () => void;
}) {
  const report = useReportChallengeScore();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const selectRef = useRef<HTMLSelectElement>(null);
  const [type, setType] = useState<ReportType>("other");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => selectRef.current?.focus());
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !report.isPending) onCloseRef.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authorId =
    challenge.type === "team"
      ? challenge.challengerTeamId || challenge.initiatedBy || ""
      : challenge.challengerId || challenge.initiatedBy || "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (reason.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }
    try {
      await report.mutateAsync({
        challengeId: challenge.id,
        contentAuthorId: authorId,
        type,
        reason: reason.trim(),
      });
      onReported();
    } catch {
      /* surfaced below */
    }
  };

  return createPortal(
    <div
      className="challenge-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-report-title"
    >
      <button
        className="challenge-confirm__scrim"
        type="button"
        aria-label="Close report"
        onClick={() => !report.isPending && onClose()}
      />
      <section>
        <header>
          <div>
            <Flag size={18} />
            <h2 id="challenge-report-title">Report this result</h2>
          </div>
          <button type="button" onClick={onClose} disabled={report.isPending} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={(event) => void submit(event)}>
          <label className="challenge-report__field">
            <span>What is wrong?</span>
            <select
              ref={selectRef}
              value={type}
              onChange={(event) => setType(event.target.value as ReportType)}
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="challenge-report__field">
            <span>Details</span>
            <textarea
              maxLength={400}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what happened so a moderator can review it."
            />
            <small>{reason.length} / 400</small>
          </label>
          {error ? (
            <p className="challenge-error" role="alert">
              {error}
            </p>
          ) : null}
          {report.isError ? (
            <p className="challenge-error" role="alert">
              {getApiErrorMessage(report.error, "The report could not be submitted.")}
            </p>
          ) : null}
          <footer>
            <Button variant="quiet" type="button" disabled={report.isPending} onClick={onClose}>
              Back
            </Button>
            <button
              className="challenge-confirm__action"
              data-tone="danger"
              type="submit"
              disabled={report.isPending}
            >
              {report.isPending ? "Reporting…" : "Submit report"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
