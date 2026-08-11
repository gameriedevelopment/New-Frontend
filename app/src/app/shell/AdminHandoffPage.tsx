import { useEffect } from "react";

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:5175";

export function AdminHandoffPage() {
  useEffect(() => {
    window.location.replace(ADMIN_URL);
  }, []);

  return (
    <main className="feature-foundation">
      <section className="state-panel">
        <h1>Opening Gamerie Operations</h1>
        <p>The administrator workspace now runs as a separate, restricted application.</p>
        <a className="button button--primary" href={ADMIN_URL}>
          Continue to operations
        </a>
      </section>
    </main>
  );
}
