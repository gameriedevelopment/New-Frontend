import { RefreshCw } from "lucide-react";
import { StatePanel } from "../../components/Feedback";
import { getErrorMessage } from "../../lib/errors";
import { useDashboardMetrics } from "./hooks";
import type { DashboardMetric } from "./types";
import "./dashboard.css";

const metricLabels = {
  users: "Players",
  teams: "Teams",
  tournaments: "Ongoing tournaments",
  games: "Games",
} as const;

function MetricSkeleton() {
  return (
    <div className="admin-metric admin-metric--loading" aria-hidden="true">
      <span />
      <i />
      <small />
    </div>
  );
}

function MetricCard({ label, metric }: { label: string; metric: DashboardMetric }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{metric.total.toLocaleString()}</strong>
      <small>{metric.thisMonth.toLocaleString()} added this month</small>
    </article>
  );
}

export function DashboardPage() {
  const metrics = useDashboardMetrics();

  return (
    <main className="admin-dashboard">
      <header className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">Platform operations</span>
          <h1>Overview</h1>
          <p>Current platform scale and the operational areas that need attention.</p>
        </div>
        <button
          className="admin-secondary-button"
          onClick={() => void metrics.refetch()}
          disabled={metrics.isFetching}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>{metrics.isFetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </header>

      {metrics.isError ? (
        <StatePanel title="Metrics are unavailable">
          <p>{getErrorMessage(metrics.error, "The platform summary could not be loaded.")}</p>
          <button className="admin-secondary-button" onClick={() => void metrics.refetch()}>
            Try again
          </button>
        </StatePanel>
      ) : (
        <section
          className="admin-metrics"
          aria-label="Platform metrics"
          aria-busy={metrics.isLoading}
        >
          {metrics.isLoading
            ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)
            : Object.entries(metricLabels).map(([key, label]) => (
                <MetricCard
                  key={key}
                  label={label}
                  metric={metrics.data![key as keyof typeof metricLabels]}
                />
              ))}
        </section>
      )}

      <section className="admin-dashboard__next">
        <span className="admin-eyebrow">Controlled rollout</span>
        <h2>Management surfaces are being connected deliberately.</h2>
        <p>
          User, community, content, competition, and finance controls will appear only after their
          server authorization and audit contracts pass the Phase 11 gate.
        </p>
      </section>
    </main>
  );
}
