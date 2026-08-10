import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ProfileDialog({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const close = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const titleId = useId();
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keyboard); requestAnimationFrame(() => close.current?.focus());
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keyboard); if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); };
  }, [onClose]);
  return createPortal(<div className="profile-dialog" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}><header><h2 id={titleId}>{title}</h2><button ref={close} type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>{children}</section></div>, document.body);
}
