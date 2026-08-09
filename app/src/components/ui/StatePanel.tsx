import type { ReactNode } from "react";

export interface StatePanelProps {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
  tone?: "neutral" | "error";
}

export function StatePanel({
  action,
  description,
  icon,
  title,
  tone = "neutral",
}: StatePanelProps) {
  return (
    <section className="g-state-panel" data-tone={tone} role={tone === "error" ? "alert" : undefined}>
      <span className="g-state-panel__mark" aria-hidden="true">
        {icon ?? "•"}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="g-state-panel__action">{action}</div> : null}
    </section>
  );
}
