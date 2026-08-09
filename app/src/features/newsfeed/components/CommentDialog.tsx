import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function CommentDialog({ children, destructive = false, onClose, title }: { children: ReactNode; destructive?: boolean; onClose: () => void; title: string }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      const preferredTarget = dialogRef.current?.querySelector<HTMLElement>(
        '[contenteditable="true"], textarea, input:not([type="hidden"]), select, footer button:not(.is-danger)',
      );
      (preferredTarget ?? closeRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return <div className="comment-dialog" role="presentation" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header>{destructive ? <AlertTriangle size={18} aria-hidden="true" /> : null}<h2 id={titleId}>{title}</h2><button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog"><X size={17} /></button></header>
      {children}
    </section>
  </div>;
}
