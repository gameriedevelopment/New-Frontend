import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import type { LeaderboardEntity, LeaderboardMetric } from "../types";
import {
  formatMetricValue,
  leaderboardImage,
  leaderboardMetrics,
  leaderboardName,
  leaderboardPath,
  leaderboardSubtitle,
} from "../utils";

export function LeaderboardTop({
  entities,
  metric,
}: {
  entities: LeaderboardEntity[];
  metric: LeaderboardMetric;
}) {
  const label = leaderboardMetrics.find((item) => item.value === metric)?.label || "Score";
  return (
    <section className="leaderboard-top" aria-label="Top ranked competitors">
      {entities.map((entity, index) => (
        <Link
          to={leaderboardPath(entity)}
          className="leaderboard-top-card"
          data-rank={index + 1}
          key={entity.id}
        >
          <span className="leaderboard-top-card__rank" aria-label={`Rank ${index + 1}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <SafeImage
            src={leaderboardImage(entity)}
            fallback={
              entity.entityType === "users" ? "/user-profile-fallback.jpg" : "/avatar-fallback.svg"
            }
            alt=""
          />
          <div className="leaderboard-top-card__identity">
            <h2>{leaderboardName(entity)}</h2>
            <p>
              {leaderboardSubtitle(entity)}
              {entity.region ? ` · ${entity.region}` : ""}
            </p>
          </div>
          <div className="leaderboard-top-card__metric">
            <strong>
              {formatMetricValue(entity, metric)}
              <small>{label}</small>
            </strong>
            <ArrowUpRight size={15} aria-hidden="true" />
          </div>
          <dl className="leaderboard-top-card__record">
            <div>
              <dt>Wins</dt>
              <dd>{entity.stats.wins}</dd>
            </div>
            <div>
              <dt>Win rate</dt>
              <dd>{Math.round(entity.stats.winRate)}%</dd>
            </div>
            <div>
              <dt>Matches</dt>
              <dd>{entity.stats.matchesPlayed}</dd>
            </div>
          </dl>
        </Link>
      ))}
    </section>
  );
}
