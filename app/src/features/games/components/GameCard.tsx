import { ArrowUpRight, Gamepad2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import type { Game, GameStats } from "../types";

export function GameCard({ game, stats }: { game: Game; stats?: GameStats }) {
  return (
    <Link className="game-card" to={`/games/${game.id}`}>
      <div className="game-card__media">
        <SafeImage src={game.wallPhoto} fallback="/profile-cover-fallback.jpg" alt="" />
        <span>{game.gameType || "Game"}</span>
      </div>
      <div className="game-card__body">
        <header>
          <div>
            <small>{game.company || "Independent title"}</small>
            <h2>{game.name}</h2>
          </div>
          <ArrowUpRight size={18} />
        </header>
        <p>
          {game.description ||
            "Open the game space to find players, teams, rankings, and competitive activity."}
        </p>
        <div className="game-card__meta">
          <span>
            <Users size={14} />
            {stats ? stats.usersCount.toLocaleString() : "—"} players
          </span>
          <span>
            <Gamepad2 size={14} />
            {stats ? stats.teamsCount.toLocaleString() : "—"} teams
          </span>
        </div>
        {game.platforms?.length ? (
          <footer>
            {game.platforms.slice(0, 4).map((platform) => (
              <span key={platform}>{platform}</span>
            ))}
            {game.platforms.length > 4 ? <span>+{game.platforms.length - 4}</span> : null}
          </footer>
        ) : null}
      </div>
    </Link>
  );
}
