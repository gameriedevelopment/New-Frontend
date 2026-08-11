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

export function LeaderboardRow({
  entity,
  metric,
  rank,
}: {
  entity: LeaderboardEntity;
  metric: LeaderboardMetric;
  rank: number;
}) {
  const label = leaderboardMetrics.find((item) => item.value === metric)?.label || "Score";
  const games = entity.games
    .slice(0, 2)
    .map((game) => game.name)
    .join(" · ");
  return (
    <Link className="leaderboard-row" to={leaderboardPath(entity)}>
      <span className="leaderboard-row__rank" aria-label={`Rank ${rank}`}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="leaderboard-row__identity">
        <SafeImage
          src={leaderboardImage(entity)}
          fallback={
            entity.entityType === "users" ? "/user-profile-fallback.jpg" : "/avatar-fallback.svg"
          }
          alt=""
        />
        <span>
          <strong>{leaderboardName(entity)}</strong>
          <small>{leaderboardSubtitle(entity)}</small>
        </span>
      </div>
      <div className="leaderboard-row__context">
        <span>{games || "No game shared"}</span>
        <small>{entity.region || "Region not shared"}</small>
      </div>
      <dl className="leaderboard-row__record">
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
      <strong className="leaderboard-row__metric">
        {formatMetricValue(entity, metric)}
        <small>{label}</small>
      </strong>
      <ArrowUpRight className="leaderboard-row__arrow" size={15} aria-hidden="true" />
    </Link>
  );
}
