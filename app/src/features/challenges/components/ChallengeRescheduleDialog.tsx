import { CalendarClock, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../components/ui";

export function ChallengeRescheduleDialog({
  mode,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  mode: "propose" | "refresh";
  pending: boolean;
  error?: string;
  onSubmit: (iso: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [value, setValue] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value) return;
    onSubmit(new Date(value).toISOString());
  };

  const copy =
    mode === "propose"
      ? {
          title: "Propose a new time",
          hint: "The other player will be asked to accept the new date before it takes effect.",
          action: "Propose",
          acting: "Proposing…",
        }
      : {
          title: "Reschedule challenge",
          hint: "Send this challenge again with a new date and time.",
          action: "Send again",
          acting: "Sending…",
        };

  return createPortal(
    <div
      className="challenge-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-reschedule-title"
    >
      <button
        className="challenge-confirm__scrim"
        type="button"
        aria-label="Close reschedule"
        onClick={() => !pending && onClose()}
      />
      <section>
        <header>
          <div>
            <CalendarClock size={18} />
            <h2 id="challenge-reschedule-title">{copy.title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label className="challenge-reschedule-dialog__field">
            <span>New date and time</span>
            <input
              ref={inputRef}
              type="datetime-local"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          <p className="challenge-reschedule-dialog__hint">{copy.hint}</p>
          {error ? (
            <p className="challenge-error" role="alert">
              {error}
            </p>
          ) : null}
          <footer>
            <Button variant="quiet" type="button" disabled={pending} onClick={onClose}>
              Back
            </Button>
            <Button type="submit" disabled={!value || pending}>
              {pending ? copy.acting : copy.action}
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
