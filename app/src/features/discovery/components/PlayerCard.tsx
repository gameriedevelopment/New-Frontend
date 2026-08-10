import { ArrowUpRight, Gamepad2, MapPin, Radio, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useTogglePlayerFollow } from "../../profile/hooks";
import type { PlayerProfile } from "../../profile/types";

export function PlayerCard({ player }: { player: PlayerProfile }) {
  const viewer = useAuthStore((state) => state.user);
  const follow = useTogglePlayerFollow(viewer?.id, player.id, Boolean(player.isFollowedByCurrentUser));
  const games = player.gamesPlayed?.length ? player.gamesPlayed : player.games ?? [];
  const primaryGame = games[0]?.game?.name || games[0]?.name;
  const platform = player.platforms?.[0] || games[0]?.platform || games[0]?.platforms?.[0];
  const location = player.personalInfo?.location || player.region;
  return <article className="player-card">
    <header><Link className="player-card__identity" to={`/profile/${player.username}`}><span><SafeImage src={player.profileImage} alt="" />{player.isOnline ? <i aria-label="Online now" /> : null}</span><div><h2>{player.username}</h2><p>{player.gamerTitle || "Gamerie player"}</p></div></Link>{viewer?.id !== player.id ? <Button size="small" variant={player.isFollowedByCurrentUser ? "quiet" : "secondary"} disabled={follow.isPending} aria-label={`${player.isFollowedByCurrentUser ? "Unfollow" : "Follow"} ${player.username}`} onClick={() => follow.mutate()}>{follow.isPending ? "Updating…" : player.isFollowedByCurrentUser ? "Following" : "Follow"}</Button> : null}</header>
    <div className="player-card__context"><div><Gamepad2 size={14} /><span><small>Primary game</small><strong>{primaryGame || (games.length ? `${games.length} connected games` : "Not shared")}</strong></span></div><div><Radio size={14} /><span><small>Player level</small><strong>{player.gameLevel || "Open profile"}</strong></span></div>{platform ? <div><span><small>Platform</small><strong>{platform}</strong></span></div> : null}</div>
    <footer>{location ? <span><MapPin size={13} />{location}</span> : null}<span><Users size={13} />{Number(player.followersCount ?? 0).toLocaleString()} followers</span><span><Trophy size={13} />{Number(player.stats?.wins ?? 0).toLocaleString()} wins</span><Link to={`/profile/${player.username}`} aria-label={`Open ${player.username}'s profile`}><ArrowUpRight size={16} /></Link></footer>
  </article>;
}
