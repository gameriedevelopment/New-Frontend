import type { ReactNode } from "react";

export function PageLoader() {
  return (
    <div className="admin-page-loader" role="status" aria-label="Loading operations workspace">
      <span />
      <span />
      <span />
    </div>
  );
}

export function StatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-state-panel" role="alert">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
