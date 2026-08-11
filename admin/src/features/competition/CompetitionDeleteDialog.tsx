import { useEffect, useId, useState, type FormEvent } from "react";

interface Props {
  open: boolean;
  name: string;
  kind: "tournament" | "achievement";
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CompetitionDeleteDialog({
  open,
  name,
  kind,
  busy,
  error,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);
  if (!open) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length >= 5) onConfirm(reason.trim());
  };
  return (
    <div className="admin-dialog" role="presentation" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id={titleId}>Remove {kind}</h2>
          <p>
            <strong>{name}</strong> can only be removed when it has no active competition
            relationships. The permanent action and reason are audited.
          </p>
        </header>
        <label>
          <span>Operational reason</span>
          <textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={5}
            maxLength={500}
            required
          />
        </label>
        {error ? (
          <p className="admin-dialog__error" role="alert">
            {error}
          </p>
        ) : null}
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
            type="submit"
            className="admin-danger-button"
            disabled={busy || reason.trim().length < 5}
          >
            {busy ? "Removing…" : "Remove record"}
          </button>
        </footer>
      </form>
    </div>
  );
}
