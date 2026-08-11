import { useEffect, useId, useState, type FormEvent } from "react";

interface DeleteGameDialogProps {
  open: boolean;
  gameName: string;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function DeleteGameDialog({
  open,
  gameName,
  busy,
  error,
  onClose,
  onConfirm,
}: DeleteGameDialogProps) {
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
          <h2 id={titleId}>Remove catalogue record</h2>
          <p>
            Remove <strong>{gameName}</strong> only after checking connected players, teams,
            achievements, and competition records. This action is permanent and audited.
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
            {busy ? "Removing…" : "Remove game"}
          </button>
        </footer>
      </form>
    </div>
  );
}
