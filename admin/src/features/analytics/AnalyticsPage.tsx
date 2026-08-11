import { useState, type ReactNode } from "react";
import { BarChart, DonutChart, LineChart } from "../../components/DataChart";
import { StatePanel } from "../../components/Feedback";
import { getErrorMessage } from "../../lib/errors";
import { usePostAnalytics } from "./hooks";
import type { AnalyticsRange } from "./types";
import "./analytics.css";

const colors = ["#c5a2fe", "#8b75aa", "#65c99a", "#d8a56d", "#7588aa", "#b56f87"];
const ranges: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const query = usePostAnalytics(range);
  const data = query.data;
  const regions = (data?.regionalData ?? []).slice(0, 6).map((item, index) => ({
    name: item.region,
    value: item.value,
    fill: colors[index % colors.length],
  }));
  const tags = (data?.topHashtags ?? []).slice(0, 8).map((item) => ({
    name: `#${item.tag}`,
    mentions: item.count,
  }));

  return (
    <main className="analytics-page">
      <header className="analytics-heading">
        <div>
          <span className="admin-eyebrow">Content intelligence</span>
          <h1>Platform analytics</h1>
          <p>
            Measured publishing, interaction, audience, and moderation signals—without synthetic
            metrics.
          </p>
        </div>
        <label>
          Reporting window
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
          >
            {ranges.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {query.isError ? (
        <StatePanel title="Analytics are unavailable">
          <p>{getErrorMessage(query.error, "The content signals could not be loaded.")}</p>
          <button className="admin-secondary-button" onClick={() => void query.refetch()}>
            Try again
          </button>
        </StatePanel>
      ) : query.isLoading ? (
        <div className="analytics-loading" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      ) : data ? (
        <>
          <section className="analytics-metrics" aria-label="Content metrics">
            <article>
              <span>Total posts</span>
              <strong>{data.totalPosts.toLocaleString()}</strong>
              <small>{formatChange(data.postGrowth)} in this window</small>
            </article>
            <article>
              <span>Interactions</span>
              <strong>{data.totalInteractions.toLocaleString()}</strong>
              <small>{formatChange(data.interactionGrowth)} in this window</small>
            </article>
            <article>
              <span>Active contributors</span>
              <strong>{data.activeUsers.toLocaleString()}</strong>
              <small>Players who posted or commented</small>
            </article>
            <article>
              <span>Flagged content</span>
              <strong>{data.flaggedContent.toLocaleString()}</strong>
              <small>{formatChange(data.flaggedContentChange)} versus prior window</small>
            </article>
          </section>

          <section className="analytics-grid">
            <ChartCard title="Publishing rhythm" copy="Daily posts over the trailing 30 days." wide>
              <LineChart
                data={data.postGrowthData}
                series={[{ key: "posts", label: "Posts", color: colors[0] }]}
              />
            </ChartCard>
            <ChartCard
              title="Audience regions"
              copy="Current player distribution by declared region."
            >
              {regions.length ? <DonutChart data={regions} valueLabel="players" /> : <EmptyChart />}
            </ChartCard>
            <ChartCard
              title="Interaction rhythm"
              copy="Recorded likes and comments; unsupported shares are excluded."
              wide
            >
              <BarChart
                data={[...data.engagementData].reverse()}
                series={[
                  { key: "likes", label: "Likes", color: colors[0] },
                  { key: "comments", label: "Comments", color: colors[2] },
                ]}
              />
            </ChartCard>
            <ChartCard title="Conversation topics" copy="Most frequently used post tags.">
              {tags.length ? (
                <BarChart
                  data={tags}
                  series={[{ key: "mentions", label: "Mentions", color: colors[1] }]}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </section>
        </>
      ) : null}
    </main>
  );
}

function ChartCard({
  title,
  copy,
  wide = false,
  children,
}: {
  title: string;
  copy: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={wide ? "analytics-card analytics-card--wide" : "analytics-card"}>
      <header>
        <strong>{title}</strong>
        <span>{copy}</span>
      </header>
      {children}
    </article>
  );
}

function EmptyChart() {
  return <p className="analytics-empty">No measured data is available for this view yet.</p>;
}

function formatChange(value: number) {
  if (!Number.isFinite(value) || value === 0) return "No change";
  return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
}
