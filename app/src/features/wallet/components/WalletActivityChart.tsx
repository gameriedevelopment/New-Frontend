import { useId, type ReactNode } from "react";
import "../wallet.css";

export interface WalletChartPoint {
  label: string;
  values: Array<{ label: string; value: number; tone: "accent" | "success" | "warning" }>;
}

export function WalletActivityChart({
  title,
  description,
  points,
  action,
}: {
  title: string;
  description: string;
  points: WalletChartPoint[];
  action?: ReactNode;
}) {
  const titleId = useId();
  const visible = points.slice(-8);
  const maximum = Math.max(
    1,
    ...visible.flatMap((point) => point.values.map((item) => item.value)),
  );
  return (
    <section className="wallet-chart" aria-labelledby={titleId}>
      <header>
        <div>
          <p>Activity trend</p>
          <h2 id={titleId}>{title}</h2>
          <span>{description}</span>
        </div>
        {action}
      </header>
      {visible.length ? (
        <>
          <div className="wallet-chart__plot">
            {visible.map((point) => (
              <div
                className="wallet-chart__group"
                key={point.label}
                tabIndex={0}
                aria-label={`${point.label}: ${point.values
                  .map((item) => `${item.label} ${item.value.toLocaleString()}`)
                  .join(", ")}`}
              >
                <div>
                  {point.values.map((item) => (
                    <i
                      key={item.label}
                      data-tone={item.tone}
                      style={{ height: `${Math.max(4, (item.value / maximum) * 100)}%` }}
                    />
                  ))}
                </div>
                <span>{point.label}</span>
                <div className="wallet-chart__tooltip" role="tooltip">
                  <strong>{point.label}</strong>
                  {point.values.map((item) => (
                    <span key={item.label}>
                      <i data-tone={item.tone} />
                      {item.label}
                      <b>{item.value.toLocaleString()}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ul className="wallet-chart__legend">
            {visible[0]?.values.map((item) => (
              <li key={item.label}>
                <i data-tone={item.tone} />
                {item.label}
              </li>
            ))}
          </ul>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th>Period</th>
                {visible[0]?.values.map((item) => (
                  <th key={item.label}>{item.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((point) => (
                <tr key={point.label}>
                  <th>{point.label}</th>
                  {point.values.map((item) => (
                    <td key={item.label}>{item.value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="wallet-chart__empty">
          Activity will appear here after the first completed wallet movement.
        </p>
      )}
    </section>
  );
}
