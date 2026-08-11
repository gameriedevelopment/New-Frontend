import { useEffect, useId, useState, type FormEvent } from "react";
import type { ModerationReport, ReportStatus } from "./types";

export function ReviewReportDialog({
  report,
  outcome,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  report: ModerationReport | null;
  outcome: Exclude<ReportStatus, "pending"> | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const titleId = useId();
  const [notes, setNotes] = useState("");

  useEffect(() => setNotes(""), [report?.id, outcome]);
  if (!report || !outcome) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (notes.trim().length >= 5) onConfirm(notes.trim());
  };

  return (
    <div className="admin-dialog" role="presentation" onMouseDown={busy ? undefined : onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id={titleId}>{outcome === "resolved" ? "Resolve report" : "Dismiss report"}</h2>
          <p>
            Record why this report is being {outcome}. The decision and notes will remain in its
            audit history.
          </p>
        </header>
        <label>
          <span>Moderation notes</span>
          <textarea
            autoFocus
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Summarise the evidence and decision"
            minLength={5}
            maxLength={1000}
            required
          />
        </label>
        {error ? <p className="admin-dialog__error">{error}</p> : null}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={busy || notes.trim().length < 5}
          >
            {busy ? "Recording…" : outcome === "resolved" ? "Resolve" : "Dismiss"}
          </button>
        </footer>
      </form>
    </div>
  );
}
