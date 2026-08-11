import { useEffect, useId, useState, type FormEvent } from "react";

interface OperatorDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  requireReason?: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function OperatorDialog(props: OperatorDialogProps) {
  const titleId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!props.open) setReason("");
  }, [props.open]);

  if (!props.open) return null;
  const valid = !props.requireReason || reason.trim().length >= 5;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) props.onConfirm(reason.trim());
  };

  return (
    <div className="admin-dialog" role="presentation" onMouseDown={props.onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id={titleId}>{props.title}</h2>
          <p>{props.description}</p>
        </header>
        {props.requireReason ? (
          <label>
            <span>Operational reason</span>
            <textarea
              autoFocus
              required
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : null}
        {props.error ? (
          <p className="admin-dialog__error" role="alert">
            {props.error}
          </p>
        ) : null}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={props.onClose}
            disabled={props.busy}
          >
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={props.busy || !valid}>
            {props.busy ? "Saving…" : props.confirmLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}
