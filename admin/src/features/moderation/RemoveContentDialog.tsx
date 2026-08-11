import { useEffect, useId, useState, type FormEvent } from "react";

export function RemoveContentDialog({
  kind,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  kind: "post" | "comment" | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const titleId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => setReason(""), [kind]);
  if (!kind) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length >= 5) onConfirm(reason.trim());
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
          <h2 id={titleId}>Remove {kind}</h2>
          <p>
            This permanently removes the {kind} and records the reason, target, content snapshot,
            operator, and request context in Gamerie&apos;s audit log.
          </p>
        </header>
        <label>
          <span>Moderation reason</span>
          <textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="State the policy basis and evidence"
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
            className="admin-secondary-button"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="admin-danger-button"
            type="submit"
            disabled={busy || reason.trim().length < 5}
          >
            {busy ? "Removing…" : `Remove ${kind}`}
          </button>
        </footer>
      </form>
    </div>
  );
}
