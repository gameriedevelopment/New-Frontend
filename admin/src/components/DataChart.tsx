import { useState } from "react";

interface ChartSeries<T> {
  key: keyof T & string;
  label: string;
  color: string;
}

function getPeriodLabel<T extends object>(item: T) {
  const values = item as Record<string, unknown>;
  return String(values.name ?? values.month ?? "Period");
}

export function LineChart<T extends object>({
  data,
  series,
  valueSuffix = "",
}: {
  data: T[];
  series: ChartSeries<T>[];
  valueSuffix?: string;
}) {
  const [active, setActive] = useState<{
    label: string;
    series: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);
  const width = 640;
  const height = 220;
  const inset = { top: 16, right: 14, bottom: 32, left: 12 };
  const plotWidth = width - inset.left - inset.right;
  const plotHeight = height - inset.top - inset.bottom;
  const max = Math.max(
    ...data.flatMap((item) => series.map((line) => Number(item[line.key]) || 0)),
    1,
  );
  const point = (value: number, index: number) => ({
    x: inset.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    y: inset.top + plotHeight - (value / max) * plotHeight,
  });

  return (
    <div className="data-chart">
      <div className="data-chart__legend" aria-hidden="true">
        {series.map((line) => (
          <span key={line.key}>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend chart">
        {[0, 0.33, 0.66, 1].map((ratio) => (
          <line
            key={ratio}
            x1={inset.left}
            x2={width - inset.right}
            y1={inset.top + plotHeight * ratio}
            y2={inset.top + plotHeight * ratio}
            className="data-chart__grid"
          />
        ))}
        {series.map((line) => {
          const points = data.map((item, index) => point(Number(item[line.key]) || 0, index));
          return (
            <g key={line.key}>
              <polyline
                points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map(({ x, y }, index) => {
                const details = {
                  label: getPeriodLabel(data[index]),
                  series: line.label,
                  value: `${String(data[index][line.key])}${valueSuffix}`,
                  x,
                  y,
                };
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={line.color}
                    tabIndex={0}
                    aria-label={`${details.label}, ${details.series}: ${details.value}`}
                    onMouseEnter={() => setActive(details)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(details)}
                    onBlur={() => setActive(null)}
                  />
                );
              })}
            </g>
          );
        })}
        {data.map((item, index) => {
          const { x } = point(0, index);
          const show =
            data.length <= 7 || index === 0 || index === data.length - 1 || index % 2 === 0;
          return show ? (
            <text key={index} x={x} y={height - 8} textAnchor="middle">
              {getPeriodLabel(item)}
            </text>
          ) : null;
        })}
      </svg>
      {active ? (
        <div
          className="data-chart__tooltip"
          role="tooltip"
          style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
        >
          <strong>{active.label}</strong>
          <span>{active.series}</span>
          <b>{active.value}</b>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>Chart values</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((line) => (
              <th key={line.key}>{line.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <th>{getPeriodLabel(item)}</th>
              {series.map((line) => (
                <td key={line.key}>
                  {String(item[line.key])}
                  {valueSuffix}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DistributionChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  return (
    <div className="distribution-chart">
      {data.map((item) => (
        <div
          key={item.name}
          tabIndex={0}
          aria-label={`${item.name}: ${item.value}%`}
          title={`${item.name}: ${item.value}%`}
        >
          <span>
            <strong>{item.name}</strong>
            <small>{item.value}%</small>
          </span>
          <i>
            <b
              style={{ width: `${Math.max(0, Math.min(item.value, 100))}%`, background: item.fill }}
            />
          </i>
        </div>
      ))}
    </div>
  );
}

export function BarChart<T extends object>({
  data,
  series,
  valueSuffix = "",
}: {
  data: T[];
  series: ChartSeries<T>[];
  valueSuffix?: string;
}) {
  const maximum = Math.max(
    1,
    ...data.flatMap((item) => series.map((entry) => Number(item[entry.key]) || 0)),
  );
  return (
    <div className="bar-chart">
      <div className="data-chart__legend" aria-hidden="true">
        {series.map((entry) => (
          <span key={entry.key}>
            <i style={{ background: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
      <div className="bar-chart__plot">
        {data.map((item, index) => (
          <div className="bar-chart__group" key={`${getPeriodLabel(item)}-${index}`}>
            <div>
              {series.map((entry) => {
                const value = Number(item[entry.key]) || 0;
                return (
                  <i
                    key={entry.key}
                    tabIndex={0}
                    style={{
                      height: `${Math.max(value ? 4 : 0, (value / maximum) * 100)}%`,
                      background: entry.color,
                    }}
                    aria-label={`${getPeriodLabel(item)}, ${entry.label}: ${value}${valueSuffix}`}
                  >
                    <span role="tooltip">
                      <strong>{getPeriodLabel(item)}</strong>
                      {entry.label}: {value.toLocaleString()}
                      {valueSuffix}
                    </span>
                  </i>
                );
              })}
            </div>
            <small>{getPeriodLabel(item)}</small>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Chart values</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((entry) => (
              <th key={entry.key}>{entry.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <th>{getPeriodLabel(item)}</th>
              {series.map((entry) => (
                <td key={entry.key}>{String(item[entry.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DonutChart({
  data,
  valueLabel = "players",
}: {
  data: { name: string; value: number; fill: string }[];
  valueLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = data
    .map((item) => {
      const start = total ? (cursor / total) * 100 : 0;
      cursor += item.value;
      const end = total ? (cursor / total) * 100 : 0;
      return `${item.fill} ${start}% ${end}%`;
    })
    .join(", ");
  return (
    <div className="donut-chart">
      <div
        className="donut-chart__plot"
        style={{ background: total ? `conic-gradient(${gradient})` : undefined }}
        role="img"
        aria-label={`${total.toLocaleString()} ${valueLabel} across ${data.length} groups`}
      >
        <span>
          <strong>{total.toLocaleString()}</strong>
          <small>{valueLabel}</small>
        </span>
      </div>
      <ul>
        {data.map((item) => (
          <li
            key={item.name}
            tabIndex={0}
            title={`${item.name}: ${item.value.toLocaleString()} ${valueLabel}`}
          >
            <i style={{ background: item.fill }} />
            <span>{item.name}</span>
            <strong>{item.value.toLocaleString()}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
