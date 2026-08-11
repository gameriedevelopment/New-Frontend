import { useEffect, useId, useRef, type ReactNode } from "react";

interface DetailDrawerProps {
  open: boolean;
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function DetailDrawer({
  open,
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  actions,
}: DetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="admin-drawer-layer">
      <button className="admin-drawer-backdrop" aria-label="Close details" onClick={onClose} />
      <aside
        className="admin-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <div>
            <span className="admin-eyebrow">{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button ref={closeRef} className="admin-drawer-close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="admin-detail-drawer__body">{children}</div>
        {actions ? <footer>{actions}</footer> : null}
      </aside>
    </div>
  );
}

export function DetailList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="admin-detail-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value || "Not available"}</dd>
        </div>
      ))}
    </dl>
  );
}
