import { useEffect, useId, useState, type FormEvent } from "react";

interface ModerationDialogProps {
  open: boolean;
  targetName: string;
  action: "restrict" | "restore";
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ModerationDialog({
  open,
  targetName,
  action,
  busy,
  error,
  onClose,
  onConfirm,
}: ModerationDialogProps) {
  const titleId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose, open]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) return;
    onConfirm(reason.trim());
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
          <h2 id={titleId}>{action === "restrict" ? "Restrict access" : "Restore access"}</h2>
          <p>
            {action === "restrict" ? "Restrict" : "Restore"} <strong>{targetName}</strong>. This
            decision will be written to the operations audit log.
          </p>
        </header>
        <label>
          <span>Reason</span>
          <textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="State the operational reason"
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
            className="admin-primary-button"
            disabled={busy || reason.trim().length < 5}
          >
            {busy ? "Saving…" : action === "restrict" ? "Restrict" : "Restore"}
          </button>
        </footer>
      </form>
    </div>
  );
}
