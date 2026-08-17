import type { PlayerProfile, ProfileGame, ProfileSkill } from "./types";

export type PlayerCardStatTone = "brand" | "achievement" | "neutral";

export interface PlayerCardStat {
  key: string;
  label: string;
  value: string;
  context: string;
  tone: PlayerCardStatTone;
}

export interface PlayerCardStrength {
  name: string;
  endorsementCount: number;
  provenance: "Community endorsed" | "Player listed";
}

export interface PlayerCardModel {
  username: string;
  gamerieId?: string;
  title: string;
  region?: string;
  profileImage?: string;
  game?: {
    name: string;
    identity?: string;
    standing?: string;
  };
  stats: PlayerCardStat[];
  strengths: PlayerCardStrength[];
  completedAchievements: number;
}

function positiveNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function gameName(game: ProfileGame | undefined) {
  return game?.game?.name || game?.name;
}

function gameIdentity(game: ProfileGame | undefined) {
  return game?.nickname || game?.gameUsername || game?.platform || game?.platforms?.[0];
}

function gameStanding(game: ProfileGame | undefined) {
  return game?.rankData?.rank || game?.rank || game?.skillLevel;
}

function cardStrengths(skills: ProfileSkill[] | undefined): PlayerCardStrength[] {
  return (skills ?? [])
    .map((skill) => ({
      name: skill.name?.trim() || "",
      endorsementCount: Math.max(
        0,
        Number(
          skill.endorsementCount ??
            (typeof skill.endorsements === "number" ? skill.endorsements : 0),
        ) || 0,
      ),
    }))
    .filter((skill) => skill.name)
    .sort((left, right) => right.endorsementCount - left.endorsementCount)
    .slice(0, 3)
    .map((skill) => ({
      ...skill,
      provenance: skill.endorsementCount > 0 ? "Community endorsed" : "Player listed",
    }));
}

export function buildPlayerCardModel(profile: PlayerProfile): PlayerCardModel {
  const stats: PlayerCardStat[] = [];
  const matches = positiveNumber(profile.stats?.matchesPlayed);
  const rankingScore = positiveNumber(profile.stats?.rankingScore);
  const winRate = matches ? positiveNumber(profile.stats?.winRate) : null;
  const tournamentWins = positiveNumber(profile.stats?.tournamentWins);
  const completedAchievements = (profile.achievements ?? []).filter(
    (achievement) => achievement.isCompleted,
  ).length;

  if (rankingScore) {
    stats.push({
      key: "ranking-score",
      label: "Ranking score",
      value: Math.round(rankingScore).toLocaleString(),
      context: "Gamerie record",
      tone: "brand",
    });
  }
  if (winRate) {
    stats.push({
      key: "win-rate",
      label: "Recorded win rate",
      value: `${Math.round(winRate)}%`,
      context: `${Math.round(matches!)} recorded matches`,
      tone: "neutral",
    });
  }
  if (tournamentWins) {
    stats.push({
      key: "tournament-wins",
      label: "Tournament wins",
      value: Math.round(tournamentWins).toLocaleString(),
      context: "Achievement",
      tone: "achievement",
    });
  } else if (completedAchievements) {
    stats.push({
      key: "achievements",
      label: "Achievements",
      value: completedAchievements.toLocaleString(),
      context: "Completed on Gamerie",
      tone: "achievement",
    });
  } else if (matches && !winRate) {
    stats.push({
      key: "matches",
      label: "Recorded matches",
      value: Math.round(matches).toLocaleString(),
      context: "Gamerie record",
      tone: "neutral",
    });
  }

  const primaryGame = (
    profile.gamesPlayed?.length ? profile.gamesPlayed : (profile.games ?? [])
  )[0];
  const primaryGameName = gameName(primaryGame);

  return {
    username: profile.username,
    gamerieId: profile.gamerieId?.trim() || undefined,
    title: profile.gamerTitle?.trim() || profile.gameLevel?.trim() || "Gamerie player",
    region: profile.region?.trim() || undefined,
    profileImage: profile.profileImage,
    game: primaryGameName
      ? {
          name: primaryGameName,
          identity: gameIdentity(primaryGame),
          standing: gameStanding(primaryGame),
        }
      : undefined,
    stats: stats.slice(0, 3),
    strengths: cardStrengths(profile.skills),
    completedAchievements,
  };
}
