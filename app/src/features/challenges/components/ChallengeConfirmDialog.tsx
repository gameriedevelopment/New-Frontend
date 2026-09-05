import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../components/ui";

export function ChallengeConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmingLabel,
  tone = "danger",
  pending,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmingLabel: string;
  tone?: "danger" | "default";
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => confirmRef.current?.focus());
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCloseRef.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="challenge-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-confirm-title"
    >
      <button
        className="challenge-confirm__scrim"
        type="button"
        aria-label="Close confirmation"
        onClick={() => !pending && onClose()}
      />
      <section data-tone={tone}>
        <header>
          <div>
            <AlertTriangle size={18} />
            <h2 id="challenge-confirm-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p>{description}</p>
        <footer>
          <Button variant="quiet" type="button" disabled={pending} onClick={onClose}>
            Keep challenge
          </Button>
          <button
            ref={confirmRef}
            className="challenge-confirm__action"
            data-tone={tone}
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? confirmingLabel : confirmLabel}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
