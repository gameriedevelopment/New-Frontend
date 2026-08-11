import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { StatePanel } from "../../components/Feedback";
import { DistributionChart, LineChart } from "../../components/DataChart";
import { getErrorMessage } from "../../lib/errors";
import { useDashboardAnalytics, useDashboardMetrics } from "./hooks";
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
  const analytics = useDashboardAnalytics();

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

      <section className="admin-dashboard__analytics" aria-labelledby="analytics-heading">
        <header>
          <span className="admin-eyebrow">Network health</span>
          <h2 id="analytics-heading">Growth and player access.</h2>
          <p>Account growth and the platform mix players have declared this year.</p>
        </header>
        <div>
          <article>
            <header>
              <div>
                <strong>Player growth</strong>
                <span>Cumulative, new, and active accounts</span>
              </div>
              <small>Year to date</small>
            </header>
            {analytics.growth.isLoading ? (
              <i className="admin-analytics-skeleton" />
            ) : analytics.growth.isError ? (
              <p>Growth data is unavailable.</p>
            ) : (
              <LineChart
                data={analytics.growth.data ?? []}
                series={[
                  { key: "users", label: "Total players", color: "#c5a2fe" },
                  { key: "newUsers", label: "New", color: "#8b75aa" },
                  { key: "activeUsers", label: "Active", color: "#65c99a" },
                ]}
              />
            )}
          </article>
          <article>
            <header>
              <div>
                <strong>Player platforms</strong>
                <span>Share of declared platform selections</span>
              </div>
              <small>Current</small>
            </header>
            {analytics.platforms.isLoading ? (
              <i className="admin-analytics-skeleton" />
            ) : analytics.platforms.isError ? (
              <p>Platform data is unavailable.</p>
            ) : analytics.platforms.data?.length ? (
              <DistributionChart data={analytics.platforms.data} />
            ) : (
              <p>No platform preferences have been recorded yet.</p>
            )}
          </article>
        </div>
      </section>

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
          <Link to="/analytics">
            <strong>Analytics</strong>
            <span>Publishing, interaction, audience, and content-health signals</span>
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
          <Link to="/audit">
            <strong>Audit history</strong>
            <span>Administrator actions, reasons, and state changes</span>
          </Link>
          <Link to="/communications">
            <strong>Communications</strong>
            <span>Official announcements and controlled audience operations</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
