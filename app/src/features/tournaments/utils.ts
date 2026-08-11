import type { Tournament, TournamentTiming } from "./types";

const day = 24 * 60 * 60 * 1000;

function time(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getTournamentTiming(tournament: Tournament, now = new Date()): TournamentTiming {
  const current = now.getTime();
  const start = time(tournament.startDate) ?? current;
  const end = time(tournament.endDate) ?? start;
  const deadline = time(tournament.registrationDeadline);
  const full = Boolean(
    tournament.maxTeams && (tournament.currentTeams ?? 0) >= tournament.maxTeams,
  );
  const lifecycle = current < start ? "upcoming" : current <= end ? "ongoing" : "completed";

  if (lifecycle === "completed")
    return { lifecycle, registration: "completed", registrationLabel: "Tournament complete" };
  if (lifecycle === "ongoing")
    return { lifecycle, registration: "started", registrationLabel: "In progress" };
  if (full) return { lifecycle, registration: "full", registrationLabel: "Capacity reached" };
  if (!deadline || current > deadline)
    return { lifecycle, registration: "closed", registrationLabel: "Registration closed" };
  if (deadline - current <= 3 * day)
    return { lifecycle, registration: "closing", registrationLabel: "Registration closing soon" };
  return { lifecycle, registration: "open", registrationLabel: "Registration open" };
}

export function formatTournamentDate(value?: string | null, includeTime = false): string {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "To be announced";
  return new Intl.DateTimeFormat(
    undefined,
    includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" },
  ).format(parsed);
}

export function formatPrize(value?: number | null): string {
  if (!value) return "No prize listed";
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export function tournamentRequirements(tournament: Tournament): string[] {
  return [
    tournament.skillLevel || "All skill levels",
    tournament.teamSize
      ? `${tournament.teamSize} player ${tournament.teamSize === 1 ? "entry" : "team"}`
      : "Open team size",
    tournament.region || "Global",
  ];
}

export function safeTournamentUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
