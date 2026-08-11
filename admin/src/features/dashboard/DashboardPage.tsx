import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
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

      <section className="admin-dashboard__workspaces" aria-labelledby="operations-heading">
        <header>
          <span className="admin-eyebrow">Operations</span>
          <h2 id="operations-heading">Open a management workspace.</h2>
          <p>Move directly into the platform area you need to review.</p>
        </header>
        <div>
          <Link to="/users">
            <strong>Players</strong>
            <span>Account access and identity review</span>
          </Link>
          <Link to="/moderation">
            <strong>Moderation</strong>
            <span>Reports, flagged content, and audit history</span>
          </Link>
          <Link to="/games">
            <strong>Games</strong>
            <span>Catalogue and integration context</span>
          </Link>
          <Link to="/competition">
            <strong>Competition</strong>
            <span>Tournaments and achievement definitions</span>
          </Link>
          <Link to="/finance">
            <strong>Finance &amp; growth</strong>
            <span>Ledger, commissions, purchases, and referral programmes</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
